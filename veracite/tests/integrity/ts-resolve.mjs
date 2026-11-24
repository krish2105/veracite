// Lets `node --test` load our TypeScript modules, which import each other without file
// extensions (Next.js / bundler style: `import { scrubPII } from "./scrub"`).
// Usage: node --import ./tests/integrity/ts-resolve.mjs --test "tests/integrity/*.test.mjs"
import { register } from "node:module";

register(
  "data:text/javascript," +
    encodeURIComponent(`
export async function resolve(specifier, context, next) {
  try {
    return await next(specifier, context);
  } catch (err) {
    const relative = specifier.startsWith("./") || specifier.startsWith("../");
    if (relative && !/\\.[cm]?[jt]s$/.test(specifier) && context.parentURL?.endsWith(".ts")) {
      return next(specifier + ".ts", context);
    }
    throw err;
  }
}`),
  import.meta.url,
);
