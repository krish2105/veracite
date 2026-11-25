/** K22: choose the home page. Pure, so it can be tested; HomeExperience supplies the browser facts. */
export type HomeView = "3d" | "plain";

/** Below this the vault's text and the cards overlap, and phones struggle with the scene. */
export const MIN_3D_WIDTH = 1024;

export function pickHome(env: { width: number; reducedMotion: boolean; webgl: boolean; search: string }): HomeView {
  if (new URLSearchParams(env.search).get("view") === "plain") return "plain";
  return env.width >= MIN_3D_WIDTH && !env.reducedMotion && env.webgl ? "3d" : "plain";
}
