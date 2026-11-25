"use client";

import * as THREE from "three";
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  ScrollControls, Scroll, useScroll, Environment, Lightformer, SpotLight, Html,
  QuadraticBezierLine, PresentationControls, Sparkles, PerformanceMonitor,
} from "@react-three/drei";
import { EffectComposer, Bloom, Vignette, Noise } from "@react-three/postprocessing";
import { easing } from "maath";
import { archivo, literata, martian } from "@/app/fonts";
import { themeStore } from "@/components/app/AppShell";
import HomeBar from "../home/HomeBar";
import HomeHero, { SPECIMEN } from "../home/HomeHero";
import { noteRect } from "../home/stage";
import LabBar from "../LabBar";
import { labPortal } from "../labPortal";
import { createStore, useStore } from "../store";
import { useFontsReady } from "../useFontsReady";
import { GENUINE, FAKES, drawDay, drawEmissive, drawBack, makeTex, type NoteData, type CanvasFonts } from "./noteTextures";

/* ------------------------------------------------------------------ constants */
const W = 3.2, H = 2.0, D = 0.04;
const BAY_Z = -84;
type Mode = "day" | "uv";

/** Uniforms shared by every note face: global UV mode + the torch's light cone. */
const U = {
  uMode: { value: 0 },
  uTorchPos: { value: new THREE.Vector3(0, 0, 10) },
  uTorchDir: { value: new THREE.Vector3(0, 0, -1) },
  uCosOuter: { value: Math.cos(0.2) },
  uCosInner: { value: Math.cos(0.11) },
  uTime: { value: 0 },
};

/** Holographic foil: hue shifts with the viewing angle, like a real security strip. */
const FOIL_VS = `varying vec2 vUv; varying vec3 vN; varying vec3 vW;
void main(){ vUv = uv; vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;
const FOIL_FS = `uniform float uTime; uniform float uMode; varying vec2 vUv; varying vec3 vN; varying vec3 vW;
vec3 pal(float t){ return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67))); }
void main(){
  vec3 v = normalize(cameraPosition - vW);
  float t = dot(vN, v) * 2.2 + vUv.y * 1.2 + vUv.x * 0.4 + uTime * 0.03;
  vec3 c = mix(vec3(0.84, 0.89, 0.89), pal(t), 0.42);
  c *= 0.9 + 0.1 * sin(vUv.y * 320.0 + vUv.x * 30.0);
  c *= 0.85 + 0.35 * pow(max(dot(reflect(-v, vN), normalize(vec3(0.3, 0.8, 0.5))), 0.0), 8.0);
  c = mix(c, c * vec3(0.5, 1.0, 1.3) * 1.25, uMode * 0.7);
  float edge = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x);
  gl_FragColor = vec4(c, 0.94 * edge);
  #include <colorspace_fragment>
}`;
const story = { explodeManual: 0 };
const vaultMode = createStore<Mode>("day");

function seeded(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }

/* ------------------------------------------------------------------ materials */
function faceMaterial(day: THREE.Texture, emissive: THREE.Texture) {
  const m = new THREE.MeshStandardMaterial({ map: day, emissiveMap: emissive, emissive: new THREE.Color("#ffffff"), emissiveIntensity: 2.4, roughness: 0.86, metalness: 0 });
  m.onBeforeCompile = (s) => {
    Object.assign(s.uniforms, U);
    s.vertexShader = s.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;")
      .replace("#include <project_vertex>", "#include <project_vertex>\nvWPos = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    s.fragmentShader = s.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWPos;\nuniform float uMode; uniform vec3 uTorchPos; uniform vec3 uTorchDir; uniform float uCosOuter; uniform float uCosInner;")
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
        float cone = smoothstep(uCosOuter, uCosInner, dot(normalize(vWPos - uTorchPos), normalize(uTorchDir)));
        float reveal = max(uMode, cone);
        totalEmissiveRadiance *= reveal;
        diffuseColor.rgb *= mix(1.0, 0.12, max(uMode, cone * 0.85));`);
  };
  m.customProgramCacheKey = () => "veracite-face-v1";
  return m;
}

type Kit = {
  slab: THREE.BoxGeometry; slab3: THREE.BoxGeometry; face: THREE.PlaneGeometry; faces3: THREE.PlaneGeometry[]; foil: THREE.PlaneGeometry;
  edge: THREE.MeshStandardMaterial; back: THREE.MeshStandardMaterial; foilMat: THREE.ShaderMaterial;
  genuine: THREE.MeshStandardMaterial[]; fakes: THREE.MeshStandardMaterial[];
};

function useKit(fonts: CanvasFonts): Kit {
  return useMemo(() => {
    const faces3 = [0, 1, 2].map((i) => {
      const g = new THREE.PlaneGeometry(W, H / 3); const uv = g.attributes.uv;
      for (let j = 0; j < uv.count; j++) uv.setY(j, (i + uv.getY(j)) / 3);
      return g;
    });
    const mk = (n: NoteData, i: number) => faceMaterial(makeTex((g, w, h) => drawDay(g, w, h, n, fonts)), makeTex((g, w, h) => drawEmissive(g, w, h, n, fonts, i)));
    return {
      slab: new THREE.BoxGeometry(W, H, D), slab3: new THREE.BoxGeometry(W, H / 3, D), face: new THREE.PlaneGeometry(W, H), faces3,
      foil: new THREE.PlaneGeometry(0.3, H * 0.94),
      edge: new THREE.MeshStandardMaterial({ color: "#dfe8e2", roughness: 0.92 }),
      back: new THREE.MeshStandardMaterial({ map: makeTex((g, w, h) => drawBack(g, w, h, fonts)), roughness: 0.9 }),
      foilMat: new THREE.ShaderMaterial({ vertexShader: FOIL_VS, fragmentShader: FOIL_FS, uniforms: { uTime: U.uTime, uMode: U.uMode }, transparent: true, depthWrite: false }),
      genuine: GENUINE.map(mk), fakes: FAKES.map((n, i) => mk(n, i + 20)),
    };
  }, [fonts]);
}

/* ------------------------------------------------------------------ notes */
function Note({ kit, mat, position, rotation, hoverable = true }: { kit: Kit; mat: THREE.Material; position: THREE.Vector3Tuple; rotation: THREE.Vector3Tuple; hoverable?: boolean }) {
  const ref = useRef<THREE.Group>(null!);
  const [hot, setHot] = useState(false);
  useFrame((_, dt) => {
    easing.damp(ref.current.position, "z", position[2] + (hot ? 0.45 : 0), 0.18, dt);
    easing.damp(ref.current.scale, "x", hot ? 1.05 : 1, 0.18, dt); ref.current.scale.y = ref.current.scale.z = ref.current.scale.x;
  });
  return (
    <group ref={ref} position={position} rotation={rotation}
      onPointerOver={hoverable ? (e) => { e.stopPropagation(); setHot(true); } : undefined}
      onPointerOut={hoverable ? () => setHot(false) : undefined}>
      <mesh geometry={kit.slab} material={kit.edge} />
      <mesh geometry={kit.face} material={mat} position-z={D / 2 + 0.0008} />
      <mesh geometry={kit.face} material={kit.back} position-z={-D / 2 - 0.0008} rotation-y={Math.PI} />
      <mesh geometry={kit.foil} material={kit.foilMat} position={[W * 0.19, 0, D / 2 + 0.0016]} />
    </group>
  );
}

type Piece = { target: THREE.Vector3 | null; label: string; source?: THREE.Vector3 };
type BezierRef = { setPoints: (a: THREE.Vector3, b: THREE.Vector3, m?: THREE.Vector3) => void; material: THREE.Material & { opacity: number; dashOffset?: number } };

/** A counterfeit note built from three slices so it can come apart into the parts it was forged from. */
function SplitNote({ kit, mat, position, rotation, scale = 1, pieces, explodeFrom }: {
  kit: Kit; mat: THREE.Material; position: THREE.Vector3Tuple; rotation: THREE.Vector3Tuple; scale?: number; pieces?: Piece[]; explodeFrom?: [number, number];
}) {
  const group = useRef<THREE.Group>(null!);
  const slices = useRef<THREE.Group[]>([]);
  const tags = useRef<(HTMLDivElement | null)[]>([]);
  const lines = useRef<(BezierRef | null)[]>([]);
  const scroll = useScroll();
  const e = useRef(0);
  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), m: new THREE.Vector3(), local: new THREE.Vector3() }), []);
  useFrame((state, dt) => {
    if (!pieces || !explodeFrom) return;
    const sc = THREE.MathUtils.smoothstep(scroll.offset, explodeFrom[0], explodeFrom[1]);
    easing.damp(e, "current", Math.max(sc, story.explodeManual), 0.3, dt);
    const k = e.current, ease = k * k * (3 - 2 * k);
    pieces.forEach((p, i) => {
      const s = slices.current[i]; if (!s) return;
      const home = new THREE.Vector3(0, (i - 1) * (H / 3), 0);
      const dest = p.target ? group.current.worldToLocal(tmp.local.copy(p.target)) : home.clone().add(new THREE.Vector3(0.9, 2.9, 0.9));
      s.position.lerpVectors(home, dest, ease);
      s.position.y += Math.sin(Math.PI * ease) * 0.6;
      s.rotation.set(ease * 0.15 * (i - 1), ease * 0.35 * (1 - i), ease * 0.08 * (i - 1));
      const fade = !p.target ? 1 - THREE.MathUtils.smoothstep(ease, 0.75, 1) * 0.65 : 1;
      s.scale.setScalar(fade);
      const tag = tags.current[i]; if (tag) tag.style.opacity = String(THREE.MathUtils.smoothstep(ease, 0.55, 0.85));
      const ln = lines.current[i];
      if (ln && p.source) {
        s.getWorldPosition(tmp.a); tmp.b.copy(p.source); tmp.m.copy(tmp.a).lerp(tmp.b, 0.5); tmp.m.y += 1.2;
        ln.setPoints(tmp.a, tmp.b, tmp.m);
        ln.material.opacity = ease * 0.9;
        if (ln.material.dashOffset !== undefined) ln.material.dashOffset -= dt * 0.6;
      }
    });
  });
  return (
    <>
      <group ref={group} position={position} rotation={rotation} scale={scale}>
        {[0, 1, 2].map((i) => (
          <group key={i} ref={(el) => { if (el) slices.current[i] = el; }} position={[0, (i - 1) * (H / 3), 0]}>
            <mesh geometry={kit.slab3} material={kit.edge} />
            <mesh geometry={kit.faces3[i]} material={mat} position-z={D / 2 + 0.0008} />
            <mesh geometry={kit.faces3[i]} material={kit.back} position-z={-D / 2 - 0.0008} rotation-y={Math.PI} />
            {pieces && (
              <Html portal={labPortal} position={[-W / 2, H / 6 + 0.42, 0]} distanceFactor={9} zIndexRange={[100, 90]} style={{ pointerEvents: "none" }}>
                <div ref={(el) => { tags.current[i] = el; }} className="lab-tag" style={{ opacity: 0 }} dangerouslySetInnerHTML={{ __html: pieces[i].label }} />
              </Html>
            )}
          </group>
        ))}
        <mesh geometry={kit.foil} material={kit.foilMat} position={[W * 0.19, 0, D / 2 + 0.0016]} visible={!pieces} />
      </group>
      {pieces?.map((p, i) => p.source ? (
        <QuadraticBezierLine key={i} ref={(el) => { lines.current[i] = el as unknown as BezierRef; }} start={[0, 0, 0]} end={[0, 0, 1]} color="#FF3B5C" lineWidth={2} dashed dashScale={6} transparent opacity={0} />
      ) : null)}
    </>
  );
}

/* ------------------------------------------------------------------ the vault */
function Vault({ kit }: { kit: Kit }) {
  const notes = useMemo(() => {
    const r = seeded(42);
    return Array.from({ length: 46 }, (_, i) => {
      const side = i % 2 ? 1 : -1; const fake = r() < 0.24;
      return {
        mat: fake ? kit.fakes[Math.floor(r() * kit.fakes.length)] : kit.genuine[Math.floor(r() * kit.genuine.length)],
        position: [side * (2.5 + r() * 1.6), -1.5 + r() * 3.2, -7 - i * 1.22 - r() * 0.5] as THREE.Vector3Tuple,
        rotation: [(r() - 0.5) * 0.3, -side * (0.85 + r() * 0.35), (r() - 0.5) * 0.25] as THREE.Vector3Tuple,
      };
    });
  }, [kit]);
  return <>{notes.map((n, i) => <Note key={i} kit={kit} mat={n.mat} position={n.position} rotation={n.rotation} />)}</>;
}

function Bay({ kit }: { kit: Kit }) {
  const titleSrc = useMemo(() => new THREE.Vector3(-2.3, 2.1, BAY_Z - 4.6), []);
  const authorSrc = useMemo(() => new THREE.Vector3(3.5, 1.3, BAY_Z - 5.2), []);
  const pieces: Piece[] = useMemo(() => [
    { target: null, label: "<b>Year, journal + DOI · invented.</b><br/>No record in Crossref, OpenAlex or arXiv." },
    { target: authorSrc.clone().add(new THREE.Vector3(-0.2, -1.25, 1.1)), source: authorSrc, label: "<b>Authors · real people (sample),</b> but Rahman never co-wrote with Lee. Rahman's real paper is this one." },
    { target: titleSrc.clone().add(new THREE.Vector3(0.3, -1.3, 1.1)), source: titleSrc, label: "<b>Title · reworded from a real 2019 review</b> by Lee &amp; Park (sample)." },
  ], [titleSrc, authorSrc]);
  return (
    <group>
      <SplitNote kit={kit} mat={kit.fakes[0]} position={[0.7, 0, BAY_Z]} rotation={[0, -0.12, 0]} scale={1.25} pieces={pieces} explodeFrom={[0.78, 0.97]} />
      <Note kit={kit} mat={kit.genuine[1]} position={titleSrc.toArray()} rotation={[0.05, 0.3, -0.04]} hoverable={false} />
      <Note kit={kit} mat={kit.genuine[0]} position={authorSrc.toArray()} rotation={[-0.04, -0.35, 0.05]} hoverable={false} />
    </group>
  );
}

function Hero({ kit }: { kit: Kit }) {
  return (
    <group>
      <Note kit={kit} mat={kit.genuine[0]} position={[2.9, 0.85, 0.4]} rotation={[0.06, -0.32, 0.06]} />
      <PresentationControls global={false} cursor snap speed={1.6} polar={[-0.5, 0.5]} azimuth={[-1, 1]}>
        <SplitNote kit={kit} mat={kit.fakes[0]} position={[1.35, -0.8, 1.7]} rotation={[-0.04, -0.2, -0.05]} />
      </PresentationControls>
    </group>
  );
}

/** The world point on the plane z = `depth` that the opening camera shows at screen pixel (x, y). */
function onScreen(cam: THREE.PerspectiveCamera, x: number, y: number, width: number, height: number, depth: number) {
  const ray = new THREE.Vector3((x / width) * 2 - 1, 1 - (y / height) * 2, 0.5).unproject(cam).sub(cam.position);
  return cam.position.clone().addScaledVector(ray, (depth - cam.position.z) / ray.z);
}

/** Home page: the counterfeit note, large and labelled, fitted to the free space. It slides away on scroll. */
function HomeSpecimen({ kit }: { kit: Kit }) {
  const { width, height } = useThree((s) => s.size);
  const scroll = useScroll();
  const group = useRef<THREE.Group>(null!);
  const items = useRef<(HTMLDivElement | null)[]>([]);
  const fit = useMemo(() => {
    const cam = new THREE.PerspectiveCamera(CAMERA.fov, width / height, CAMERA.near, CAMERA.far);
    cam.position.set(0, 0, 10);
    cam.lookAt(1, -0.1, 0);
    cam.updateMatrixWorld();
    const r = noteRect(width, height);
    const at = (x: number) => onScreen(cam, x, r.cy, width, height, 1.2);
    return { position: at(r.cx), scale: at(r.cx - r.width / 2).distanceTo(at(r.cx + r.width / 2)) / W };
  }, [width, height]);
  useFrame(() => {
    const away = THREE.MathUtils.smoothstep(scroll.offset, 0.03, 0.16);
    group.current.position.set(fit.position.x + away * 8, fit.position.y + away * 1.5, fit.position.z);
    group.current.visible = away < 0.99;
    const label = String(1 - THREE.MathUtils.smoothstep(scroll.offset, 0.008, 0.05));
    items.current.forEach((el) => { if (el) el.style.opacity = label; });
  });
  return (
    <group ref={group} scale={fit.scale}>
      <PresentationControls global={false} cursor snap speed={1.6} polar={[-0.4, 0.4]} azimuth={[-0.8, 0.8]}>
        <SplitNote kit={kit} mat={kit.fakes[0]} position={[0, 0, 0]} rotation={[-0.03, -0.14, -0.035]} />
        <group rotation={[-0.03, -0.14, -0.035]}>
          {SPECIMEN.map((p, i) => (
            <Html key={p.part} portal={labPortal} position={p.at} zIndexRange={[20, 10]} style={{ pointerEvents: "none" }}>
              <div ref={(el) => { items.current[i] = el; }}><div className="hx-pin"><i /><div><b>{p.part}</b>{p.finding}</div></div></div>
            </Html>
          ))}
          <Html portal={labPortal} position={[0, -1.14, 0]} zIndexRange={[20, 10]} style={{ pointerEvents: "none" }}>
            <div ref={(el) => { items.current[SPECIMEN.length] = el; }}><div className="hx-stamp">Chimera · do not cite</div></div>
          </Html>
        </group>
      </PresentationControls>
    </group>
  );
}

/* ------------------------------------------------------------------ camera, torch, lighting */
function Rig() {
  const scroll = useScroll();
  const look = useRef(new THREE.Vector3(1, -0.1, 0));
  const { pathP, pathL } = useMemo(() => {
    const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
    return {
      pathP: new THREE.CatmullRomCurve3([v(0, 0, 10), v(0.4, 0.2, 1), v(-0.4, 0.4, -24), v(0.3, -0.2, -52), v(-0.2, 0.2, -72), v(-1.8, 0.2, BAY_Z + 10), v(-2.5, 0.9, BAY_Z + 12.5)]),
      pathL: new THREE.CatmullRomCurve3([v(1, -0.1, 0), v(0.4, 0, -12), v(0, 0, -40), v(0, 0, -64), v(0, 0, BAY_Z + 2), v(-1.6, 0.2, BAY_Z), v(-2.4, 0.9, BAY_Z - 4)]),
    };
  }, []);
  useFrame((state, dt) => {
    const t = scroll.offset;
    const p = pathP.getPoint(t);
    p.x += state.pointer.x * 0.3; p.y += state.pointer.y * 0.18;
    easing.damp3(state.camera.position, p, 0.3, dt);
    easing.damp3(look.current, pathL.getPoint(t), 0.3, dt);
    state.camera.lookAt(look.current);
  });
  return null;
}

function Torch({ mode }: { mode: Mode }) {
  const body = useRef<THREE.Group>(null!);
  const spot = useRef<THREE.SpotLight>(null!);
  const v = useMemo(() => ({ ray: new THREE.Raycaster(), tgt: new THREE.Vector3(), head: new THREE.Vector3(), right: new THREE.Vector3(), up: new THREE.Vector3(), dir: new THREE.Vector3() }), []);
  useFrame((state, dt) => {
    const { camera, pointer } = state;
    v.ray.setFromCamera(pointer, camera);
    v.tgt.copy(v.ray.ray.origin).addScaledVector(v.ray.ray.direction, 8);
    v.right.setFromMatrixColumn(camera.matrixWorld, 0); v.up.setFromMatrixColumn(camera.matrixWorld, 1);
    v.head.copy(v.tgt).addScaledVector(v.ray.ray.direction, -3.4).addScaledVector(v.right, 0.95).addScaledVector(v.up, -0.6);
    easing.damp3(body.current.position, v.head, 0.06, dt);
    body.current.lookAt(v.tgt);
    spot.current.position.copy(body.current.position);
    spot.current.target.position.copy(v.tgt); spot.current.target.updateMatrixWorld();
    U.uTorchPos.value.copy(body.current.position);
    U.uTorchDir.value.copy(v.dir.copy(v.tgt).sub(body.current.position).normalize());
  });
  const uv = mode === "uv";
  return (
    <>
      <group ref={body}>
        <mesh rotation-x={Math.PI / 2} position-z={-0.45}>
          <cylinderGeometry args={[0.075, 0.085, 0.8, 32]} />
          <meshStandardMaterial color="#1b1f24" metalness={0.8} roughness={0.35} />
        </mesh>
        <mesh rotation-x={Math.PI / 2} position-z={0.05}>
          <cylinderGeometry args={[0.15, 0.1, 0.26, 40]} />
          <meshStandardMaterial color="#2a2f36" metalness={0.9} roughness={0.25} />
        </mesh>
        <mesh position-z={0.185}>
          <circleGeometry args={[0.135, 40]} />
          <meshBasicMaterial color={uv ? "#b9a2ff" : "#8f74ff"} toneMapped={false} />
        </mesh>
        {[-0.62, -0.52, -0.42].map((z) => (
          <mesh key={z} rotation-x={Math.PI / 2} position-z={z}>
            <torusGeometry args={[0.087, 0.008, 8, 32]} />
            <meshStandardMaterial color="#5b4bc4" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
      </group>
      <SpotLight ref={spot} volumetric angle={0.3} penumbra={0.55} distance={16} attenuation={7} anglePower={5}
        intensity={uv ? 120 : 40} opacity={uv ? 0.55 : 0.22} color={uv ? "#8d6bff" : "#a08cff"} />
    </>
  );
}

function ModeLighting({ mode, kit }: { mode: Mode; kit: Kit }) {
  const amb = useRef<THREE.AmbientLight>(null!);
  const key = useRef<THREE.DirectionalLight>(null!);
  const { scene } = useThree();
  const c = useMemo(() => ({ bgDay: new THREE.Color("#EDF1EE"), bgUv: new THREE.Color("#07061A"), white: new THREE.Color("#ffffff"), violet: new THREE.Color("#5a3dff"), edgeDay: new THREE.Color("#dfe8e2"), edgeUv: new THREE.Color("#241d5e") }), []);
  useFrame((s, dt) => {
    U.uTime.value = s.clock.elapsedTime;
    easing.damp(U.uMode, "value", mode === "uv" ? 1 : 0, 0.35, dt);
    const m = U.uMode.value;
    amb.current.intensity = THREE.MathUtils.lerp(1.0, 0.5, m);
    amb.current.color.lerpColors(c.white, c.violet, m);
    key.current.intensity = THREE.MathUtils.lerp(2.2, 0.04, m);
    if (scene.background instanceof THREE.Color) scene.background.lerpColors(c.bgDay, c.bgUv, m);
    if (scene.fog && scene.background instanceof THREE.Color) scene.fog.color.copy(scene.background);
    kit.edge.color.lerpColors(c.edgeDay, c.edgeUv, m);
    scene.environmentIntensity = THREE.MathUtils.lerp(1, 0.12, m);
  });
  return (
    <>
      <color attach="background" args={["#EDF1EE"]} />
      <fog attach="fog" args={["#EDF1EE", 9, 36]} />
      <ambientLight ref={amb} />
      <directionalLight ref={key} position={[5, 6, 8]} />
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={2.2} position={[0, 5, -2]} scale={[12, 2, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.4} color="#c9b8ff" position={[-6, 0, 2]} scale={[2, 8, 1]} rotation-y={Math.PI / 2} />
        <Lightformer form="rect" intensity={1.4} color="#9ae6e0" position={[6, 0, 2]} scale={[2, 8, 1]} rotation-y={-Math.PI / 2} />
        <Lightformer form="ring" intensity={2} position={[0, 0, 8]} scale={3} />
      </Environment>
    </>
  );
}

/* ------------------------------------------------------------------ page */
const SECTIONS = [
  { eyebrow: "Concept A · Watermark Vault", h: "Every reference, held to the light.", p: "Veracite checks every citation against the world's research registries and shows its receipts. Your cursor is a UV torch. Drag the counterfeit to turn it over. Scroll to enter the vault.", hint: "Scroll ↓ · move the torch · drag the card" },
  { eyebrow: "01 · The vault", h: "Thousands of references. Some are counterfeit.", p: "Genuine references carry hidden marks: DOI microprint and a seal from two independent registries. AI-made fakes copy the look, never the marks." },
  { eyebrow: "02 · Under the lamp", h: "Shine the torch. Fakes can't hide.", p: "Sweep the torch across the walls, or switch on the UV lamp to light the whole vault at once. Genuine references glow VERIFIED; counterfeits show VOID." },
  { eyebrow: "03 · Inspection bay", h: "This one looks perfect.", p: "Real-looking authors, a real-looking journal, a DOI in the right format. A student would cite it. Keep scrolling and Veracite takes it apart." },
  { eyebrow: "04 · Reference X-ray", h: "Real parts. Wrong combination.", p: "SP Jain policy §h(ix) warns that AI builds references from components of real ones. Veracite traces every piece back to its source, and says Not found where there is none.", cta: true },
];

function Overlay({ home, onExplode }: { home: boolean; onExplode: () => void }) {
  return (
    <Scroll html style={{ width: "100%" }}>
      {home && <HomeHero />}
      {SECTIONS.map((s, i) => (home && i === 0 ? null :
        <section key={i} className="lab-section" style={{ top: `${i * 100}vh` }}>
          <div className={i ? "lab-card" : undefined}>
            <p className="lab-eyebrow">{s.eyebrow}</p>
            <h2 className="lab-h">{s.h}</h2>
            <p className="lab-p">{s.p}</p>
            {s.cta && (
              <div className="lab-cta">
                {home && <a href="/xray">Check your own references</a>}
                <button className={home ? "ghost" : undefined} onClick={onExplode}>Reassemble / take apart</button>
              </div>
            )}
            {s.hint && <p className="lab-hint">{s.hint}</p>}
          </div>
        </section>
      ))}
    </Scroll>
  );
}

function Scene({ fonts, home }: { fonts: CanvasFonts; home: boolean }) {
  const mode = useStore(vaultMode);
  const kit = useKit(fonts);
  const uv = mode === "uv";
  return (
    <>
      <ModeLighting mode={mode} kit={kit} />
      <ScrollControls pages={SECTIONS.length} damping={0.22}>
        <Rig />
        <Torch mode={mode} />
        {home ? <HomeSpecimen kit={kit} /> : <Hero kit={kit} />}
        <Vault kit={kit} />
        <Bay kit={kit} />
        {uv && <Sparkles count={420} scale={[10, 6, 100]} position={[0, 0, -42]} size={2.2} speed={0.25} color="#4DF2FF" opacity={0.8} />}
        <Overlay home={home} onExplode={() => { story.explodeManual = story.explodeManual ? 0 : 1; }} />
      </ScrollControls>
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={uv ? 1.5 : 0.35} luminanceThreshold={uv ? 0.32 : 0.85} luminanceSmoothing={0.2} />
        <Noise opacity={0.025} premultiply />
        <Vignette darkness={uv ? 0.55 : 0.28} offset={0.3} />
      </EffectComposer>
    </>
  );
}

function AdaptiveQuality() {
  const setDpr = useThree((st) => st.setDpr);
  return <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.75)} />;
}
const GL = { antialias: false, powerPreference: "high-performance" as const };
const CAMERA = { position: [0, 0, 10] as THREE.Vector3Tuple, fov: 42, near: 0.1, far: 160 };

/** Mounted once and never re-rendered (see store.ts): the theme reaches the scene through a store. */
const VaultCanvas = memo(function VaultCanvas({ fonts, home }: { fonts: CanvasFonts; home: boolean }) {
  return (
    <Canvas dpr={1.75} gl={GL} camera={CAMERA}>
      <AdaptiveQuality />
      <Scene fonts={fonts} home={home} />
    </Canvas>
  );
});

/** `home` and `onPlain` serve the front page (K22); /lab/vault renders this without them. `home` never changes. */
export default function VaultExperience({ home = false, onPlain }: { home?: boolean; onPlain?: () => void }) {
  useMemo(() => {
    vaultMode.set(new URLSearchParams(window.location.search).get("mode") === "uv" ? "uv" : "day");
  }, []);
  // The front page shares the app's UV-lamp setting; this runs again each time the visitor comes back.
  useEffect(() => {
    if (!home) return;
    const forced = new URLSearchParams(window.location.search).get("mode") === "uv";
    vaultMode.set(forced || localStorage.getItem("vx-theme") === "dark" ? "uv" : "day");
  }, [home]);
  // Next.js keeps a left page hidden instead of unmounting it, which kills its WebGL context: start a fresh canvas.
  const [visit, setVisit] = useState(0);
  useLayoutEffect(() => () => setVisit((v) => v + 1), []);
  const mode = useStore(vaultMode);
  const fonts = useMemo<CanvasFonts>(() => ({ display: archivo.style.fontFamily, body: literata.style.fontFamily, mono: martian.style.fontFamily }), []);
  const ready = useFontsReady([`800 30px ${fonts.display}`, `600 33px ${fonts.body}`, `italic 400 25px ${fonts.body}`, `500 15px ${fonts.mono}`]);
  const uv = mode === "uv";
  const vars = {
    "--lab-bg": uv ? "#07061A" : "#EDF1EE", "--lab-ink": uv ? "#E9E6FF" : "#0E2A23", "--lab-ink2": uv ? "#ABA5DA" : "#41574F",
    "--lab-accent": uv ? "#FF4FD8" : "#5B4BC4", "--lab-alert": uv ? "#FF3B5C" : "#C3263B", "--lab-ok": uv ? "#4DF2FF" : "#1F6F68",
    "--lab-line": uv ? "rgba(233,230,255,.2)" : "rgba(14,42,35,.18)", "--lab-panel": uv ? "rgba(20,16,52,.62)" : "rgba(244,248,243,.72)",
    "--lab-display": "var(--font-archivo)", "--lab-body": "var(--font-literata)", "--lab-mono": "var(--font-martian)",
    "--lab-stretch": "125%", "--lab-case": "uppercase", "--lab-track": "0.01em", "--lab-dw": "780", "--lab-hsize": "clamp(28px, 3.3vw, 54px)",
  } as CSSProperties;
  const modeLabel = uv ? "Back to daylight" : "Switch on UV lamp";
  const toggle = () => {
    vaultMode.set(uv ? "day" : "uv");
    if (!home) return;
    themeStore.set(uv ? "light" : "dark");
    localStorage.setItem("vx-theme", uv ? "light" : "dark");
  };
  return (
    <div className="lab" style={vars}>
      <div ref={(el) => { if (el) labPortal.current = el; }} className="lab-portal" />
      {ready ? <VaultCanvas key={visit} fonts={fonts} home={home} /> : <div className="lab-loading">Printing security notes…</div>}
      {home ? (
        <HomeBar modeLabel={modeLabel} pressed={uv} onToggle={toggle} onPlain={onPlain} />
      ) : (
        <LabBar current="vault" modeLabel={modeLabel} pressed={uv} onToggle={toggle} />
      )}
    </div>
  );
}
