import { defineConfig } from "vitest/config";

// Vitest, not Jest: NestJS 12 publishes ESM-only packages, and Vitest runs ESM
// natively. The API still compiles to CommonJS for Node 22.12+ (require(esm)).
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.spec.ts"],
  },
});
