/**
 * Fixed overlay that drei <Html> labels render into. Without it, ScrollControls makes
 * Html elements children of its scrolling div, so they drift off-screen as you scroll.
 */
export const labPortal: { current: HTMLDivElement } = { current: null as unknown as HTMLDivElement };
