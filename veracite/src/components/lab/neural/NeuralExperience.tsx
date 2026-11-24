"use client";

import * as THREE from "three";
import { memo, useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ScrollControls, Scroll, useScroll, Html, Line, Sparkles, PerformanceMonitor } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise, DepthOfField } from "@react-three/postprocessing";
import { easing } from "maath";
import LabBar from "../LabBar";
import { labPortal } from "../labPortal";
import { createStore, useStore } from "../store";

type Mode = "ink" | "brainbow";
type V3 = [number, number, number];

/* ------------------------------------------------------------------ the crew */
const AGENTS: { id: string; name: string; role: string; engine: string; pos: V3; glow: string }[] = [
  { id: "student", name: "You", role: "Principal investigator · final say on everything", engine: "Human", pos: [0, 0, 0], glow: "#F4F1FF" },
  { id: "planner", name: "Planner", role: "Turns your question into a search plan", engine: "LLM · Groq", pos: [3.3, 1.4, -7], glow: "#59F3FF" },
  { id: "scout", name: "Scout", role: "Searches Crossref · OpenAlex · arXiv", engine: "Code + LLM", pos: [-2.7, -0.6, -14.5], glow: "#FF5AD9" },
  { id: "verifier", name: "Verifier", role: "Proves every source is real. Can't be persuaded", engine: "Code only · no AI", pos: [2.6, 0.5, -25], glow: "#7CFF9E" },
  { id: "reader", name: "Reader", role: "Quotes only text that exists in the source", engine: "LLM + quote match", pos: [-2.9, 1.2, -33], glow: "#FFD166" },
  { id: "skeptic", name: "Skeptic", role: "Attacks every claim · hunts counter-evidence", engine: "LLM · different model", pos: [2.7, -1.2, -41], glow: "#FF8A4C" },
  { id: "scribe", name: "Scribe", role: "Drafts only from approved evidence", engine: "LLM · whitelist", pos: [-1.8, 0.7, -49], glow: "#A98BFF" },
  { id: "clerk", name: "Integrity Clerk", role: "APA 7 · AI-use statement · certificate", engine: "Code", pos: [0.9, 0, -57], glow: "#F4F1FF" },
];
/** Gates sit on the axon leaving these agents (index = source agent). */
const GATES = [
  { from: 1, label: "Approve plan", done: "Plan approved by you", at: 0.55, scroll: 0.2 },
  { from: 3, label: "Approve sources", done: "Sources approved by you", at: 0.5, scroll: 0.62 },
  { from: 6, label: "Approve claims", done: "Claims approved by you", at: 0.5, scroll: 0.9 },
];
const CLOUD_C = new THREE.Vector3(-0.2, -0.1, -19.8);

const neuralMode = createStore<Mode>("ink");
const gates = createStore<boolean[]>([false, false, false]);
const approveGate = (i: number) => gates.set((a) => (a[i] ? a : a.map((v, j) => (j === i ? true : v))));

const PAL = {
  ink: { bg: "#E6EAEC", ink: "#16120E", stain: "#A8701F", ok: "#1F6F68", alert: "#B3261E" },
  brainbow: { bg: "#04050A", ink: "#F4F1FF", stain: "#FFFFFF", ok: "#7CFF9E", alert: "#FF4D6A" },
};

function seeded(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }

/* ------------------------------------------------------------------ soma shader */
const NOISE = `
vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 mod289(vec4 x){return x-floor(x*(1.0/289.0))*289.0;}
vec4 permute(vec4 x){return mod289(((x*34.0)+1.0)*x);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}
float snoise(vec3 v){
  const vec2 C=vec2(1.0/6.0,1.0/3.0); const vec4 D=vec4(0.0,0.5,1.0,2.0);
  vec3 i=floor(v+dot(v,C.yyy)); vec3 x0=v-i+dot(i,C.xxx);
  vec3 g=step(x0.yzx,x0.xyz); vec3 l=1.0-g; vec3 i1=min(g.xyz,l.zxy); vec3 i2=max(g.xyz,l.zxy);
  vec3 x1=x0-i1+C.xxx; vec3 x2=x0-i2+C.yyy; vec3 x3=x0-D.yyy; i=mod289(i);
  vec4 p=permute(permute(permute(i.z+vec4(0.0,i1.z,i2.z,1.0))+i.y+vec4(0.0,i1.y,i2.y,1.0))+i.x+vec4(0.0,i1.x,i2.x,1.0));
  float n_=0.142857142857; vec3 ns=n_*D.wyz-D.xzx; vec4 j=p-49.0*floor(p*ns.z*ns.z);
  vec4 x_=floor(j*ns.z); vec4 y_=floor(j-7.0*x_); vec4 x=x_*ns.x+ns.yyyy; vec4 y=y_*ns.x+ns.yyyy; vec4 h=1.0-abs(x)-abs(y);
  vec4 b0=vec4(x.xy,y.xy); vec4 b1=vec4(x.zw,y.zw); vec4 s0=floor(b0)*2.0+1.0; vec4 s1=floor(b1)*2.0+1.0; vec4 sh=-step(h,vec4(0.0));
  vec4 a0=b0.xzyw+s0.xzyw*sh.xxyy; vec4 a1=b1.xzyw+s1.xzyw*sh.zzww;
  vec3 p0=vec3(a0.xy,h.x); vec3 p1=vec3(a0.zw,h.y); vec3 p2=vec3(a1.xy,h.z); vec3 p3=vec3(a1.zw,h.w);
  vec4 norm=taylorInvSqrt(vec4(dot(p0,p0),dot(p1,p1),dot(p2,p2),dot(p3,p3))); p0*=norm.x; p1*=norm.y; p2*=norm.z; p3*=norm.w;
  vec4 m=max(0.6-vec4(dot(x0,x0),dot(x1,x1),dot(x2,x2),dot(x3,x3)),0.0); m=m*m;
  return 42.0*dot(m*m,vec4(dot(p0,x0),dot(p1,x1),dot(p2,x2),dot(p3,x3)));
}`;
const SOMA_VS = `${NOISE}
uniform float uTime; uniform float uHover; uniform float uSeed; varying vec3 vN; varying vec3 vV; varying float vNoise;
void main(){
  float n = snoise(position * 1.5 + vec3(uTime * 0.18 + uSeed));
  float n2 = snoise(position * 4.2 - vec3(uTime * 0.32)) * 0.35;
  vNoise = n;
  vec3 p = position + normal * (n * 0.075 + n2 * 0.025 + uHover * 0.07 * sin(uTime * 7.0 + position.y * 6.0));
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const SOMA_FS = `
uniform vec3 uColor; uniform vec3 uInk; uniform float uNight; varying vec3 vN; varying vec3 vV; varying float vNoise;
void main(){
  float fr = pow(1.0 - max(dot(vN, vV), 0.0), 2.0);
  float stipple = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  vec3 day = mix(uInk, vec3(0.42, 0.33, 0.22), pow(fr, 1.4) * 0.75) + (stipple - 0.5) * 0.05 * fr;
  vec3 night = uColor * (0.22 + 0.3 * vNoise + fr * 2.6);
  gl_FragColor = vec4(mix(day, night, uNight), 1.0);
  #include <colorspace_fragment>
}`;

/* ------------------------------------------------------------------ geometry builders */
function dendrites(seed: number) {
  const r = seeded(seed); const pts: THREE.Vector3[] = [];
  const grow = (start: THREE.Vector3, dir: THREE.Vector3, steps: number, len: number, depth: number) => {
    const p = start.clone(); const d = dir.clone();
    for (let s = 0; s < steps; s++) {
      d.add(new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.55)).normalize();
      const q = p.clone().addScaledVector(d, len * (1 - s / (steps * 1.6)));
      pts.push(p.clone(), q.clone()); p.copy(q);
      if (depth < 2 && s > 1 && r() < 0.34) grow(p, d.clone().add(new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5)).normalize(), steps - s, len * 0.75, depth + 1);
    }
  };
  for (let b = 0; b < 15; b++) {
    const dir = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
    grow(dir.clone().multiplyScalar(0.5), dir, 7, 0.3, 0);
  }
  return pts;
}
function axonCurve(a: V3, b: V3, seed: number) {
  const r = seeded(seed); const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const m1 = A.clone().lerp(B, 0.33).add(new THREE.Vector3((r() - 0.5) * 3, (r() - 0.5) * 2.2, 0));
  const m2 = A.clone().lerp(B, 0.66).add(new THREE.Vector3((r() - 0.5) * 3, (r() - 0.5) * 2.2, 0));
  return new THREE.CatmullRomCurve3([A, m1, m2, B]);
}

/* ------------------------------------------------------------------ pieces */
function Soma({ i, night, onFocus }: { i: number; night: number; onFocus: (i: number) => void }) {
  const a = AGENTS[i];
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: SOMA_VS, fragmentShader: SOMA_FS,
    uniforms: { uTime: { value: 0 }, uHover: { value: 0 }, uSeed: { value: i * 3.1 }, uNight: { value: 0 }, uColor: { value: new THREE.Color(a.glow) }, uInk: { value: new THREE.Color(PAL.ink.ink) } },
  }), [i, a.glow]);
  const hov = useRef(0); const [hot, setHot] = useState(false);
  const pts = useMemo(() => dendrites(100 + i * 17), [i]);
  const label = useRef<HTMLDivElement>(null);
  const wp = useMemo(() => new THREE.Vector3(...a.pos), [a.pos]);
  useFrame((s, dt) => {
    mat.uniforms.uTime.value = s.clock.elapsedTime;
    if (label.current) label.current.style.opacity = String(1 - THREE.MathUtils.smoothstep(s.camera.position.distanceTo(wp), 8.5, 12.5));
    easing.damp(hov, "current", hot ? 1 : 0, 0.2, dt); mat.uniforms.uHover.value = hov.current;
    mat.uniforms.uNight.value = night;
  });
  const lineCol = night > 0.5 ? a.glow : PAL.ink.ink;
  const big = a.id === "student" || a.id === "clerk";
  return (
    <group position={a.pos}>
      <mesh material={mat} scale={big ? 0.66 : 0.58} onPointerOver={(e) => { e.stopPropagation(); setHot(true); document.body.style.cursor = "pointer"; }}
        onPointerOut={() => { setHot(false); document.body.style.cursor = ""; }} onClick={() => onFocus(i)}>
        <icosahedronGeometry args={[1, 24]} />
      </mesh>
      <Line points={pts} segments color={lineCol} lineWidth={night > 0.5 ? 1.1 : 1.3} transparent opacity={night > 0.5 ? 0.75 : 0.85} />
      <Html portal={labPortal} position={[0.85, 0.8, 0]} distanceFactor={6.5} zIndexRange={[20, 10]} style={{ pointerEvents: "none" }}>
        <div ref={label} className="nc-label" data-agent={a.id} style={{ opacity: 0, transition: "opacity .3s" }}>
          <strong>{a.name}</strong>
          <span>{a.role}</span>
          <em>{a.engine}</em>
        </div>
      </Html>
    </group>
  );
}

function Axons({ night, approved }: { night: number; approved: boolean[] }) {
  const data = useMemo(() => AGENTS.slice(0, -1).map((a, i) => {
    const curve = axonCurve(a.pos, AGENTS[i + 1].pos, 7 + i * 13);
    const gate = GATES.findIndex((g) => g.from === i);
    return { curve, tube: new THREE.TubeGeometry(curve, 180, 0.032, 8, false), gate };
  }), []);
  const myelin = useMemo(() => {
    const out: { p: THREE.Vector3; q: THREE.Quaternion }[] = [];
    data.forEach(({ curve }) => { for (let k = 1; k < 9; k++) { const u = k / 9; const p = curve.getPointAt(u); const t = curve.getTangentAt(u); out.push({ p, q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), t) }); } });
    return out;
  }, [data]);
  const myelinRef = useRef<THREE.InstancedMesh>(null!);
  const pulseRef = useRef<THREE.InstancedMesh>(null!);
  const phases = useRef(data.map(() => [0, 0.25, 0.5, 0.75]));
  useEffect(() => {
    const m = new THREE.Matrix4();
    myelin.forEach((s, i) => { m.compose(s.p, s.q, new THREE.Vector3(1, 1, 1)); myelinRef.current.setMatrixAt(i, m); });
    myelinRef.current.instanceMatrix.needsUpdate = true;
  }, [myelin]);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), c: new THREE.Color(), q: new THREE.Quaternion(), s: new THREE.Vector3() }), []);
  useFrame((_, dt) => {
    let n = 0;
    data.forEach((d, i) => {
      const gate = d.gate >= 0 ? GATES[d.gate] : null;
      const blocked = gate && !approved[d.gate];
      phases.current[i] = phases.current[i].map((ph, k) => {
        let next = ph + dt * 0.12;
        if (blocked && next > gate.at - 0.02 - k * 0.025) next = Math.min(next, gate.at - 0.02 - k * 0.025);
        if (next >= 1) next -= 1;
        const p = d.curve.getPointAt(Math.max(0, Math.min(1, next)));
        const pulse = 1 + 0.25 * Math.sin(next * 40);
        tmp.s.setScalar(pulse);
        tmp.m.compose(p, tmp.q, tmp.s); pulseRef.current.setMatrixAt(n, tmp.m);
        tmp.c.set(night > 0.5 ? AGENTS[i].glow : PAL.ink.stain); pulseRef.current.setColorAt(n, tmp.c);
        n++;
        return next;
      });
    });
    pulseRef.current.instanceMatrix.needsUpdate = true;
    if (pulseRef.current.instanceColor) pulseRef.current.instanceColor.needsUpdate = true;
  });
  const tubeCol = night > 0.5 ? "#8C86B8" : PAL.ink.ink;
  return (
    <group>
      {data.map((d, i) => (
        <mesh key={i} geometry={d.tube}>
          <meshBasicMaterial color={night > 0.5 ? AGENTS[i].glow : tubeCol} transparent opacity={night > 0.5 ? 0.55 : 0.9} />
        </mesh>
      ))}
      <instancedMesh ref={myelinRef} args={[undefined, undefined, myelin.length]}>
        <capsuleGeometry args={[0.075, 0.42, 6, 12]} />
        <meshStandardMaterial color={night > 0.5 ? "#2b2747" : "#3a322a"} roughness={0.6} transparent opacity={night > 0.5 ? 0.6 : 0.85} />
      </instancedMesh>
      <instancedMesh ref={pulseRef} args={[undefined, undefined, data.length * 4]}>
        <sphereGeometry args={[0.1, 16, 12]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      {GATES.map((g, gi) => <Gate key={gi} curve={data[g.from].curve} at={g.at} open={approved[gi]} night={night} />)}
    </group>
  );
}

function Gate({ curve, at, open, night }: { curve: THREE.CatmullRomCurve3; at: number; open: boolean; night: number }) {
  const ref = useRef<THREE.Group>(null!); const cross = useRef<THREE.Group>(null!);
  const { p, look } = useMemo(() => { const p = curve.getPointAt(at); return { p, look: p.clone().add(curve.getTangentAt(at)) }; }, [curve, at]);
  useEffect(() => { ref.current.lookAt(look); }, [look]);
  useFrame((s, dt) => {
    easing.damp(cross.current.scale, "x", open ? 0.001 : 1, 0.2, dt); cross.current.scale.y = cross.current.scale.x;
    ref.current.rotateZ(dt * (open ? 1.6 : 0.25));
    const pulse = open ? 1.08 + Math.sin(s.clock.elapsedTime * 3) * 0.04 : 1;
    easing.damp(ref.current.scale, "x", pulse, 0.25, dt); ref.current.scale.y = ref.current.scale.z = ref.current.scale.x;
  });
  const col = open ? (night > 0.5 ? PAL.brainbow.ok : PAL.ink.ok) : (night > 0.5 ? "#FFB547" : PAL.ink.stain);
  return (
    <group ref={ref} position={p}>
      <mesh><torusGeometry args={[0.46, 0.04, 16, 80]} /><meshBasicMaterial color={col} toneMapped={false} /></mesh>
      <mesh><torusGeometry args={[0.58, 0.008, 8, 80]} /><meshBasicMaterial color={col} transparent opacity={0.6} /></mesh>
      <group ref={cross}>
        <mesh rotation-z={Math.PI / 4}><boxGeometry args={[0.62, 0.05, 0.05]} /><meshBasicMaterial color={col} /></mesh>
        <mesh rotation-z={-Math.PI / 4}><boxGeometry args={[0.62, 0.05, 0.05]} /><meshBasicMaterial color={col} /></mesh>
      </group>
    </group>
  );
}

/** The Scout's candidate sources. 24% are AI-claimed references that don't exist; the Verifier prunes them. */
function SourceCloud({ night }: { night: number }) {
  const scroll = useScroll();
  const N = 130;
  const data = useMemo(() => {
    const r = seeded(9);
    return Array.from({ length: N }, () => {
      const d = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize();
      const p = CLOUD_C.clone().addScaledVector(d, 1.6 + r() * 2.2); p.z += (r() - 0.5) * 2;
      return { p, fake: r() < 0.24, ph: r() * 6.28, fall: 0.6 + r() * 0.8 };
    });
  }, []);
  const scout = new THREE.Vector3(...AGENTS[2].pos), verifier = new THREE.Vector3(...AGENTS[3].pos);
  const geo = useMemo(() => {
    const mk = (fake: boolean, from: THREE.Vector3) => new THREE.BufferGeometry().setFromPoints(data.filter((d) => d.fake === fake).flatMap((d) => [from, d.p]));
    return { scoutReal: mk(false, scout), scoutFake: mk(true, scout), verReal: mk(false, verifier) };
  }, [data]); // eslint-disable-line react-hooks/exhaustive-deps
  const inst = useRef<THREE.InstancedMesh>(null!);
  const mats = { scoutReal: useRef<THREE.LineBasicMaterial>(null!), scoutFake: useRef<THREE.LineBasicMaterial>(null!), verReal: useRef<THREE.LineBasicMaterial>(null!) };
  const prune = useRef(0);
  const tagFake = useRef<HTMLDivElement>(null); const tagReal = useRef<HTMLDivElement>(null);
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), c: new THREE.Color(), q: new THREE.Quaternion(), s: new THREE.Vector3(), p: new THREE.Vector3() }), []);
  const firstFake = data.findIndex((d) => d.fake), firstReal = data.findIndex((d) => !d.fake);
  useFrame((st, dt) => {
    const target = THREE.MathUtils.smoothstep(scroll.offset, 0.4, 0.56);
    easing.damp(prune, "current", target, 0.4, dt);
    const k = prune.current, t = st.clock.elapsedTime;
    const pal = night > 0.5 ? PAL.brainbow : PAL.ink;
    data.forEach((d, i) => {
      tmp.p.copy(d.p);
      let sc = 1;
      if (d.fake) {
        const fl = k > 0.05 && k < 0.6 ? (Math.sin(t * 22 + d.ph) > 0 ? 1.3 : 0.6) : 1;
        tmp.p.y -= Math.pow(Math.max(0, k - 0.35) / 0.65, 2) * 6 * d.fall;
        sc = fl * (1 - THREE.MathUtils.smoothstep(k, 0.6, 1));
        tmp.c.set(k > 0.08 ? pal.alert : (night > 0.5 ? "#FF5AD9" : pal.ink));
      } else {
        sc = 1 + k * 0.35;
        tmp.c.set(k > 0.5 ? pal.ok : (night > 0.5 ? "#FF5AD9" : pal.ink));
      }
      tmp.s.setScalar(Math.max(sc, 0.0001)); tmp.m.compose(tmp.p, tmp.q, tmp.s);
      inst.current.setMatrixAt(i, tmp.m); inst.current.setColorAt(i, tmp.c);
    });
    inst.current.instanceMatrix.needsUpdate = true; if (inst.current.instanceColor) inst.current.instanceColor.needsUpdate = true;
    mats.scoutReal.current.opacity = 0.32; mats.scoutFake.current.opacity = 0.32 * (1 - k);
    mats.verReal.current.opacity = k * 0.5;
    if (tagFake.current) tagFake.current.style.opacity = String(THREE.MathUtils.smoothstep(k, 0.05, 0.25) * (1 - THREE.MathUtils.smoothstep(k, 0.8, 0.95)));
    if (tagReal.current) tagReal.current.style.opacity = String(THREE.MathUtils.smoothstep(k, 0.55, 0.8));
  });
  const lineCol = night > 0.5 ? "#c9c3ff" : PAL.ink.ink;
  return (
    <group>
      <instancedMesh ref={inst} args={[undefined, undefined, N]}>
        <sphereGeometry args={[0.06, 14, 10]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      <lineSegments geometry={geo.scoutReal}><lineBasicMaterial ref={mats.scoutReal} color={lineCol} transparent /></lineSegments>
      <lineSegments geometry={geo.scoutFake}><lineBasicMaterial ref={mats.scoutFake} color={lineCol} transparent /></lineSegments>
      <lineSegments geometry={geo.verReal}><lineBasicMaterial ref={mats.verReal} color={night > 0.5 ? PAL.brainbow.ok : PAL.ink.ok} transparent opacity={0} /></lineSegments>
      <Html portal={labPortal} position={data[firstFake].p.toArray()} distanceFactor={9} style={{ pointerEvents: "none" }}>
        <div ref={tagFake} className="lab-tag" style={{ opacity: 0 }}><b>○ Not found</b> · “Wellbeing apps raise GPA” (2020). No record in Crossref, OpenAlex or arXiv. Pruned and logged. SAMPLE</div>
      </Html>
      <Html portal={labPortal} position={data[firstReal].p.toArray()} distanceFactor={9} style={{ pointerEvents: "none" }}>
        <div ref={tagReal} className="lab-tag ok" style={{ opacity: 0 }}><b>● Verified</b> · Rahman &amp; Okafor (2021). DOI, title, authors and year agree in 2 registries. SAMPLE</div>
      </Html>
    </group>
  );
}

function Outputs({ night }: { night: number }) {
  const base = new THREE.Vector3(...AGENTS[7].pos);
  const items = ["References · APA 7", "AI-use statement", "Verification certificate"];
  const ref = useRef<THREE.Group>(null!);
  const docs = useRef<(HTMLDivElement | null)[]>([]);
  useFrame((s) => {
    ref.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.3) * 0.25;
    const o = String(1 - THREE.MathUtils.smoothstep(s.camera.position.distanceTo(base), 9, 14));
    docs.current.forEach((d) => { if (d) d.style.opacity = o; });
  });
  return (
    <group ref={ref} position={[base.x + 2.4, base.y + 0.2, base.z - 1]}>
      {items.map((t, i) => (
        <group key={t} position={[0, 0.9 - i * 0.9, i * -0.35]}>
          <mesh>
            <boxGeometry args={[1.9, 0.62, 0.04]} />
            <meshStandardMaterial color={night > 0.5 ? "#151326" : "#F7F8F6"} emissive={night > 0.5 ? "#A98BFF" : "#000000"} emissiveIntensity={night > 0.5 ? 0.25 : 0} roughness={0.6} />
          </mesh>
          <Html portal={labPortal} position={[-0.85, 0.18, 0.03]} distanceFactor={8} transform style={{ pointerEvents: "none" }}>
            <div ref={(el) => { docs.current[i] = el; }} className="nc-doc" style={{ opacity: 0 }}>{t}<small>SAMPLE · generated from the log</small></div>
          </Html>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------ camera + gates UI */
const STOPS: { cam: V3; look: V3 }[] = [
  { cam: [5.6, 2.6, 6.4], look: [1.4, 0.3, -4.5] },
  { cam: [-0.6, 2.4, -1.5], look: [3.3, 1.2, -7.5] },
  { cam: [5.8, 3.2, -9.5], look: [-1.2, -0.3, -17.5] },
  { cam: [-8.2, 4.6, -10.5], look: [-0.4, -0.2, -21.5] },
  { cam: [3.8, 1.8, -28], look: [-1.2, 0.6, -34] },
  { cam: [-3.6, 1.6, -40], look: [0.2, -0.2, -46.5] },
  { cam: [7.5, 7.5, -38], look: [0, -0.4, -30] },
];
function Rig({ dof }: { dof: THREE.Vector3 }) {
  const scroll = useScroll();
  const look = useRef(new THREE.Vector3(...STOPS[0].look));
  const paths = useMemo(() => ({
    cam: new THREE.CatmullRomCurve3(STOPS.map((s) => new THREE.Vector3(...s.cam))),
    look: new THREE.CatmullRomCurve3(STOPS.map((s) => new THREE.Vector3(...s.look))),
  }), []);
  useFrame((s, dt) => {
    const t = scroll.offset;
    const p = paths.cam.getPoint(t); p.x += s.pointer.x * 0.5; p.y += s.pointer.y * 0.3;
    easing.damp3(s.camera.position, p, 0.35, dt);
    easing.damp3(look.current, paths.look.getPoint(t), 0.35, dt);
    s.camera.lookAt(look.current);
    dof.copy(look.current);
  });
  return null;
}

function GateButtons({ approved, setApproved, auto }: { approved: boolean[]; setApproved: (i: number) => void; auto: boolean }) {
  const scroll = useScroll();
  const curves = useMemo(() => AGENTS.slice(0, -1).map((a, i) => axonCurve(a.pos, AGENTS[i + 1].pos, 7 + i * 13)), []);
  const btns = useRef<(HTMLButtonElement | null)[]>([]);
  const pts = useMemo(() => GATES.map((g) => curves[g.from].getPointAt(g.at)), [curves]);
  useFrame((s) => {
    if (auto) GATES.forEach((g, i) => { if (!approved[i] && scroll.offset > g.scroll) setApproved(i); });
    pts.forEach((p, i) => { const b = btns.current[i]; if (b) { const o = 1 - THREE.MathUtils.smoothstep(s.camera.position.distanceTo(p), 8, 12); b.style.opacity = String(o); b.style.pointerEvents = o > 0.3 ? "auto" : "none"; } });
  });
  return (
    <>
      {GATES.map((g, i) => {
        const p = pts[i];
        return (
          <Html portal={labPortal} key={i} position={[p.x, p.y - 0.85, p.z]} center distanceFactor={7} zIndexRange={[25, 15]}>
            <button ref={(el) => { btns.current[i] = el; }} className={`nc-gate ${approved[i] ? "on" : ""}`} onClick={() => setApproved(i)} disabled={approved[i]} style={{ opacity: 0 }}>
              {approved[i] ? `✓ ${g.done}` : `✋ ${g.label}`}
            </button>
          </Html>
        );
      })}
    </>
  );
}

/* ------------------------------------------------------------------ overlay copy */
const SECTIONS = [
  { eyebrow: "Concept B · Neural Crew", h: "Watch the AI think. Then overrule it.", p: "Veracite's agents form a small nervous system. Every signal is traced, every source is tested, and three synapses only fire when you approve.", hint: "Scroll ↓ · hover a neuron · press the gates" },
  { eyebrow: "01 · Planner", h: "It plans. You approve.", p: "The Planner turns your question into sub-questions and search terms. Signals pile up at the first gate: nothing is searched until you approve the plan." },
  { eyebrow: "02 · Scout", h: "One question. A hundred candidates.", p: "The Scout searches Crossref, OpenAlex and arXiv in parallel. Every candidate is a registry record, but some match references an AI claimed exist." },
  { eyebrow: "03 · Verifier", h: "Fakes get pruned. Live.", p: "The Verifier is plain code, no AI, so it can't be persuaded. Two registries must agree on DOI, title, authors and year. What doesn't survive falls away and is logged as Not found." },
  { eyebrow: "04 · Reader + Skeptic", h: "Quotes are matched. Claims are attacked.", p: "The Reader may only quote text that exists. The Skeptic, a different model with no shared memory, challenges every claim and searches for counter-evidence." },
  { eyebrow: "05 · Scribe", h: "A draft that can't cite outside the evidence.", p: "The Scribe writes only from approved sources; any source it invents is blocked by code. You keep, edit or drop every claim at the last gate." },
  { eyebrow: "06 · Integrity Clerk", h: "Every reference real. Every claim traceable.", p: "APA 7 references, an AI-use statement generated from the logs, and a certificate your professor can re-verify. You stay in charge." },
];

function Overlay() {
  return (
    <Scroll html style={{ width: "100%" }}>
      {SECTIONS.map((s, i) => (
        <section key={i} className="lab-section" style={{ top: `${i * 100}vh` }}>
          <div className={i ? "lab-card" : undefined}>
            <p className="lab-eyebrow">{s.eyebrow}</p>
            <h2 className="lab-h">{s.h}</h2>
            <p className="lab-p">{s.p}</p>
            {s.hint && <p className="lab-hint">{s.hint}</p>}
          </div>
        </section>
      ))}
    </Scroll>
  );
}

function ModeBackdrop({ mode, nightRef }: { mode: Mode; nightRef: { current: number } }) {
  const { scene } = useThree();
  const c = useMemo(() => ({ a: new THREE.Color(PAL.ink.bg), b: new THREE.Color(PAL.brainbow.bg) }), []);
  useFrame((_, dt) => {
    easing.damp(nightRef, "current", mode === "brainbow" ? 1 : 0, 0.3, dt);
    if (scene.background instanceof THREE.Color) scene.background.lerpColors(c.a, c.b, nightRef.current);
    if (scene.fog && scene.background instanceof THREE.Color) scene.fog.color.copy(scene.background);
  });
  return (
    <>
      <color attach="background" args={[PAL.ink.bg]} />
      <fog attach="fog" args={[PAL.ink.bg, 9, 34]} />
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 6, 5]} intensity={1.6} />
    </>
  );
}

function Scene({ auto }: { auto: boolean }) {
  const mode = useStore(neuralMode);
  const approved = useStore(gates);
  const setApproved = approveGate;
  const nightRef = useRef(0);
  const night = mode === "brainbow" ? 1 : 0;
  const dof = useMemo(() => new THREE.Vector3(), []);
  return (
    <>
      <ModeBackdrop mode={mode} nightRef={nightRef} />
      <ScrollControls pages={SECTIONS.length} damping={0.25}>
        <Rig dof={dof} />
        {AGENTS.map((_, i) => <Soma key={i} i={i} night={night} onFocus={() => {}} />)}
        <Axons night={night} approved={approved} />
        <SourceCloud night={night} />
        <Outputs night={night} />
        <GateButtons approved={approved} setApproved={setApproved} auto={auto} />
        <Sparkles count={260} scale={[14, 8, 64]} position={[0, 0, -28]} size={night ? 2.4 : 1.4} speed={0.2} color={night ? "#c9c3ff" : PAL.ink.ink} opacity={night ? 0.7 : 0.35} />
        <Overlay />
      </ScrollControls>
      <EffectComposer multisampling={4}>
        <DepthOfField target={dof} focalLength={0.09} bokehScale={night ? 2.2 : 1.4} height={540} />
        <Bloom mipmapBlur intensity={night ? 1.6 : 0.25} luminanceThreshold={night ? 0.22 : 0.9} luminanceSmoothing={0.2} />
        <Noise opacity={night ? 0.03 : 0.045} premultiply />
        <Vignette darkness={night ? 0.6 : 0.25} offset={0.3} />
      </EffectComposer>
    </>
  );
}

function AdaptiveQuality() {
  const setDpr = useThree((st) => st.setDpr);
  return <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.75)} />;
}
const GL = { antialias: false, powerPreference: "high-performance" as const };
const CAMERA = { position: [5.6, 2.6, 6.4] as V3, fov: 45, near: 0.1, far: 120 };

/** Mounted once and never re-rendered (see store.ts): theme and gate state reach the scene through stores. */
const NeuralCanvas = memo(function NeuralCanvas({ auto }: { auto: boolean }) {
  return (
    <Canvas dpr={1.75} gl={GL} camera={CAMERA}>
      <AdaptiveQuality />
      <Scene auto={auto} />
    </Canvas>
  );
});

export default function NeuralExperience() {
  const auto = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("mode") === "brainbow") neuralMode.set("brainbow");
    gates.set([false, false, false]);
    return params.get("auto") === "1";
  }, []);
  const mode = useStore(neuralMode);
  const night = mode === "brainbow";
  const vars = {
    "--lab-bg": night ? PAL.brainbow.bg : PAL.ink.bg, "--lab-ink": night ? "#F4F1FF" : "#16120E", "--lab-ink2": night ? "#B9B4D6" : "#4C463E",
    "--lab-accent": night ? "#59F3FF" : "#A8701F", "--lab-alert": night ? PAL.brainbow.alert : PAL.ink.alert, "--lab-ok": night ? PAL.brainbow.ok : PAL.ink.ok,
    "--lab-line": night ? "rgba(244,241,255,.2)" : "rgba(22,18,14,.18)", "--lab-panel": night ? "rgba(14,13,28,.66)" : "rgba(240,243,244,.78)",
    "--lab-display": "var(--font-bricolage)", "--lab-body": "var(--font-instrument)", "--lab-mono": "var(--font-plex-mono)",
    "--lab-stretch": "100%", "--lab-case": "none", "--lab-track": "-0.025em", "--lab-dw": "780", "--lab-hsize": "clamp(34px, 4.4vw, 72px)",
  } as CSSProperties;
  return (
    <div className="lab nc" style={vars} data-night={night ? "1" : "0"}>
      <div ref={(el) => { if (el) labPortal.current = el; }} className="lab-portal" />
      <NeuralCanvas auto={auto} />
      <LabBar current="neural" modeLabel={night ? "Cajal ink (light)" : "Brainbow (fluorescent)"} pressed={night} onToggle={() => neuralMode.set(night ? "ink" : "brainbow")} />
    </div>
  );
}
