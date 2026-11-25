/** K22/K24: choose the home page. Pure, so it can be tested; HomeExperience supplies the browser facts. */
export type HomeView = "3d" | "plain";

/** From this width the headline sits beside the 3D note; below it, only upright screens have room to stack them. */
export const MIN_WIDE = 1024;
/** Shorter upright screens cannot fit the headline, the note and the three buttons. */
export const MIN_UPRIGHT_HEIGHT = 600;

export function pickHome(env: { width: number; height: number; reducedMotion: boolean; webgl: boolean; search: string }): HomeView {
  if (new URLSearchParams(env.search).get("view") === "plain" || env.reducedMotion || !env.webgl) return "plain";
  const upright = env.height > env.width && env.height >= MIN_UPRIGHT_HEIGHT && env.width >= 320;
  return env.width >= MIN_WIDE || upright ? "3d" : "plain";
}
