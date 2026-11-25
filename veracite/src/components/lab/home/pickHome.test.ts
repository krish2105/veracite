/** K22: which home page a visitor gets. The 3D vault is for capable wide screens; everyone else gets the plain cards. */
import { describe, expect, it } from "vitest";
import { pickHome } from "./pickHome";

const laptop = { width: 1440, reducedMotion: false, webgl: true, search: "" };

describe("pickHome", () => {
  it("shows the 3D vault on a laptop", () => expect(pickHome(laptop)).toBe("3d"));
  it("shows it on a projector zoomed to 125%", () => expect(pickHome({ ...laptop, width: 1152 })).toBe("3d"));
  it("shows plain cards on phones and narrow windows", () => {
    expect(pickHome({ ...laptop, width: 390 })).toBe("plain");
    expect(pickHome({ ...laptop, width: 1023 })).toBe("plain");
  });
  it("respects the reduced-motion setting", () => expect(pickHome({ ...laptop, reducedMotion: true })).toBe("plain"));
  it("shows plain cards without WebGL", () => expect(pickHome({ ...laptop, webgl: false })).toBe("plain"));
  it("can be forced plain with ?view=plain", () => expect(pickHome({ ...laptop, search: "?view=plain" })).toBe("plain"));
});
