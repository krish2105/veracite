import { defineConfig } from "vitest/config";

// Unit tests live next to the code as *.test.ts. Live network tests (*.live.test.ts) skip unless LIVE=1.
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
