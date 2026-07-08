import path from "node:path";
import { defineConfig } from "vitest/config";

const srcDir = path.resolve(process.cwd(), "src");

export default defineConfig({
  resolve: {
    alias: {
      "@": srcDir,
    },
  },
  test: {
    environment: "node",
    fileParallelism: false,
    setupFiles: ["./src/test/setup.ts"],
  },
});
