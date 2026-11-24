"use client";

import * as THREE from "three";
import { useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Html, Line } from "@react-three/drei";
import { useStore } from "../../lab/store";
import { skinStore, themeStore } from "../AppShell";

type Kind = "article" | "preprint" | "book";
type Status = "verified" | "partial" | "retracted";
type Node = { id: number; pos: THREE.Vector3; kind: Kind; status: Status; topic: number; title: string };

const TOPICS = ["Sleep & screens", "Melatonin & light", "Social media", "Interventions"];
const TITLES = ["Screen time and sleep quality (2021)", "Blue light and melatonin (2019)", "Bedtime phones in Gulf teens (2023)", "Digital curfews (preprint, 2025)", "Night-time social media (2018, retracted)", "Null result on sleep duration (2022)"];

function seeded(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }

/** 3D Evidence Galaxy: papers are nodes, citations are threads. Shape = source type, colour = verification status. */
function Graph() {
  const skin = useStore(skinStore); const theme = useStore(themeStore);
  const dark = theme === "dark";
  const col = {
    verified: dark ? (skin === "neural" ? "#7CFF9E" : "#4DF2FF") : "#1F6F68",
    partial: dark ? "#FFC857" : "#A8701F",
    retracted: dark ? "#FF4D6A" : "#C3263B",
    edge: dark ? (skin === "neural" ? "#8c86b8" : "#5b4bc4") : "#0E2A23",
  };
  const { nodes, edges } = useMemo(() => {
    const r = seeded(11); const nodes: Node[] = [];
    const centers = TOPICS.map((_, i) => new THREE.Vector3(Math.cos(i * 1.57) * 3.4, (r() - 0.5) * 1.6, Math.sin(i * 1.57) * 3.4));
    for (let i = 0; i < 72; i++) {
      const topic = i % 4; const c = centers[topic];
      const d = new THREE.Vector3(r() - 0.5, r() - 0.5, r() - 0.5).normalize().multiplyScalar(0.6 + r() * 1.7);
      const kind: Kind = r() < 0.72 ? "article" : r() < 0.6 ? "preprint" : "book";
      const status: Status = r() < 0.8 ? "verified" : r() < 0.75 ? "partial" : "retracted";
      nodes.push({ id: i, pos: c.clone().add(d), kind, status, topic, title: TITLES[i % TITLES.length] });
    }
    const edges: [THREE.Vector3, THREE.Vector3][] = [];
    nodes.forEach((n) => { for (let k = 0; k < 2; k++) { const m = nodes[Math.floor(r() * nodes.length)]; if (m.topic === n.topic || r() < 0.12) edges.push([n.pos, m.pos]); } });
    return { nodes, edges, centers };
  }, []);
  const [hover, setHover] = useState<number | null>(null);
  const edgePts = useMemo(() => edges.flatMap(([a, b]) => [a, b]), [edges]);
  return (
    <group>
      <Line points={edgePts} segments color={col.edge} lineWidth={0.8} transparent opacity={dark ? 0.35 : 0.22} />
      {nodes.map((n) => (
        <mesh key={n.id} position={n.pos} scale={hover === n.id ? 1.6 : 1}
          onPointerOver={(e) => { e.stopPropagation(); setHover(n.id); }} onPointerOut={() => setHover(null)}>
          {n.kind === "article" ? <sphereGeometry args={[0.14, 20, 16]} /> : n.kind === "preprint" ? <octahedronGeometry args={[0.17]} /> : <boxGeometry args={[0.22, 0.22, 0.22]} />}
          <meshStandardMaterial color={col[n.status]} emissive={dark ? col[n.status] : "#000"} emissiveIntensity={dark ? 0.8 : 0} roughness={0.45} />
        </mesh>
      ))}
      {hover !== null && (
        <Html position={nodes[hover].pos} style={{ pointerEvents: "none" }}>
          <div className="lab-tag ok" style={{ transform: "translate(12px,-50%)", width: 220 }}>
            <b>{nodes[hover].status === "verified" ? "● Verified" : nodes[hover].status === "partial" ? "◐ Partial" : "○ Retracted"}</b> · {nodes[hover].title}
            <br />{nodes[hover].kind} · {TOPICS[nodes[hover].topic]} · SAMPLE
          </div>
        </Html>
      )}
    </group>
  );
}

export default function Galaxy() {
  return (
    <Canvas dpr={[1, 2]} camera={{ position: [0, 2.4, 7.4], fov: 48 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={1.2} />
      <directionalLight position={[4, 6, 5]} intensity={1.8} />
      <Graph />
      <OrbitControls enablePan={false} autoRotate autoRotateSpeed={0.5} enableDamping minDistance={5} maxDistance={16} />
    </Canvas>
  );
}
