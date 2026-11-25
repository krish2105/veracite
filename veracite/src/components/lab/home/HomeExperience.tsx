"use client";

import dynamic from "next/dynamic";
import { Component, useState, useSyncExternalStore, type ReactNode } from "react";
import PlainHome from "./PlainHome";
import { pickHome, type HomeView } from "./pickHome";

/* WebGL is client-only, and phones never download it. */
const Vault = dynamic(() => import("../vault/VaultExperience"), { ssr: false, loading: () => <p className="home-loading">Opening the vault…</p> });

let webgl: boolean | undefined;
function hasWebGL() {
  if (webgl === undefined) {
    const gl = document.createElement("canvas").getContext("webgl2");
    webgl = !!gl;
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
  }
  return webgl;
}

const REDUCED = "(prefers-reduced-motion: reduce)";
function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED);
  query.addEventListener("change", onChange);
  window.addEventListener("resize", onChange);
  return () => {
    query.removeEventListener("change", onChange);
    window.removeEventListener("resize", onChange);
  };
}
const current = (): HomeView =>
  pickHome({ width: window.innerWidth, reducedMotion: window.matchMedia(REDUCED).matches, webgl: hasWebGL(), search: window.location.search });
/* The server cannot know the screen, so it says "pending" and the browser decides. */
const onServer = () => "pending" as const;

/** If the 3D scene crashes or fails to load, the visitor still gets a working home page. */
class Fallback extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? <PlainHome /> : this.props.children;
  }
}

export default function HomeExperience() {
  const view = useSyncExternalStore<HomeView | "pending">(subscribe, current, onServer);
  const [chosePlain, setChosePlain] = useState(false);
  if (view === "pending") return <div className="home-pending"><PlainHome /></div>;
  if (view === "plain" || chosePlain) return <PlainHome onShow3d={view === "3d" ? () => setChosePlain(false) : undefined} />;
  return (
    <Fallback>
      <Vault home onPlain={() => setChosePlain(true)} />
    </Fallback>
  );
}
