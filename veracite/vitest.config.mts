import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Unit tests live next to the code as *.test.ts. Live network tests (*.live.test.ts) skip unless LIVE=1.
export default defineConfig({
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
