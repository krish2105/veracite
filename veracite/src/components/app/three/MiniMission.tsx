"use client";

import * as THREE from "three";
import { useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useStore } from "../../lab/store";
import { skinStore, themeStore } from "../AppShell";

/** Mission Control strip: the agent pipeline in 3D. Signals queue at the gate that's waiting for the student. */
const NODES = [
  { k: "You", gate: false, c: "#F4F1FF" }, { k: "Planner", gate: false, c: "#59F3FF" }, { k: "Plan", gate: true, c: "" },
  { k: "Scout", gate: false, c: "#FF5AD9" }, { k: "Verifier", gate: false, c: "#7CFF9E" }, { k: "Sources", gate: true, c: "" },
  { k: "Reader", gate: false, c: "#FFD166" }, { k: "Skeptic", gate: false, c: "#FF8A4C" }, { k: "Scribe", gate: false, c: "#A98BFF" },
  { k: "Claims", gate: true, c: "" }, { k: "Clerk", gate: false, c: "#F4F1FF" },
];
const WAITING_AT = 9; // the "Approve claims" gate is open in this sample session

function palette(skin: string, theme: string) {
  const dark = theme === "dark";
  if (skin === "watermark") return dark
    ? { node: "#4DF2FF", tube: "#3b2f8f", pulse: "#FF4FD8", gateOpen: "#4DF2FF", gateWait: "#FFC857", brainbow: false }
    : { node: "#0E2A23", tube: "#1F6F68", pulse: "#5B4BC4", gateOpen: "#1F6F68", gateWait: "#A8701F", brainbow: false };
  return dark
    ? { node: "#ffffff", tube: "#2a2950", pulse: "#ffffff", gateOpen: "#7CFF9E", gateWait: "#FFD166", brainbow: true }
    : { node: "#16120E", tube: "#16120E", pulse: "#A8701F", gateOpen: "#1F6F68", gateWait: "#A8701F", brainbow: false };
}

function Pipeline() {
  const skin = useStore(skinStore); const theme = useStore(themeStore);
  const pal = palette(skin, theme);
  const { curve, tube, pts } = useMemo(() => {
    const pts = NODES.map((_, i) => new THREE.Vector3(-7 + i * 1.4, Math.sin(i * 0.9) * 0.55, Math.cos(i * 0.7) * 0.6));
    const curve = new THREE.CatmullRomCurve3(pts);
    return { curve, tube: new THREE.TubeGeometry(curve, 300, 0.035, 8, false), pts };
  }, []);
  const gateU = useMemo(() => pts.map((_, i) => i / (pts.length - 1)), [pts]);
  const pulses = useRef<THREE.InstancedMesh>(null!);
  const group = useRef<THREE.Group>(null!);
  const phases = useRef(Array.from({ length: 7 }, (_, k) => k / 7));
  const m = useMemo(() => new THREE.Matrix4(), []);
  useFrame((s, dt) => {
    group.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.25) * 0.05;
    const stop = gateU[WAITING_AT] - 0.012;
    phases.current = phases.current.map((p, k) => {
      let n = p + dt * 0.07;
      if (n > stop - k * 0.012) n = Math.min(n, stop - k * 0.012);
      return n;
    });
    phases.current.forEach((p, k) => { const v = curve.getPoint(Math.max(0, p)); m.makeTranslation(v.x, v.y, v.z); pulses.current.setMatrixAt(k, m); });
    pulses.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <group ref={group}>
      <mesh geometry={tube}><meshBasicMaterial color={pal.tube} transparent opacity={theme === "dark" ? 0.9 : 0.55} /></mesh>
      {NODES.map((n, i) => n.gate ? (
        <mesh key={i} position={pts[i]} rotation-y={Math.PI / 2}>
          <torusGeometry args={[0.28, 0.035, 12, 48]} />
          <meshBasicMaterial color={i < WAITING_AT ? pal.gateOpen : pal.gateWait} toneMapped={false} />
        </mesh>
      ) : (
        <mesh key={i} position={pts[i]}>
          <icosahedronGeometry args={[0.24, 3]} />
          <meshStandardMaterial color={pal.brainbow ? n.c : pal.node} emissive={theme === "dark" ? (pal.brainbow ? n.c : pal.node) : "#000"} emissiveIntensity={theme === "dark" ? 0.9 : 0} roughness={0.5} />
        </mesh>
      ))}
      <instancedMesh ref={pulses} args={[undefined, undefined, 7]}>
        <sphereGeometry args={[0.075, 12, 10]} />
        <meshBasicMaterial color={pal.pulse} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/** Fit the 14-unit-wide pipeline to whatever width the card has. */
function FitCamera() {
  const { camera, size } = useThree();
  useFrame(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(size.height, 1);
    const z = 16.5 / (2 * Math.tan((cam.fov * Math.PI) / 360) * aspect);
    cam.position.set(0, 0.9, Math.min(Math.max(z, 6), 40)); cam.lookAt(0, 0, 0);
  });
  return null;
}

export default function MiniMission() {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 1, 10], fov: 22 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={1.4} />
      <directionalLight position={[3, 5, 6]} intensity={1.6} />
      <FitCamera />
      <Pipeline />
    </Canvas>
  );
}
