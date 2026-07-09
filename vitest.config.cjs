// This CommonJS config is a temporary Windows config-loading workaround because TS/MJS configs fail in this workspace with an esbuild access-denied loader error.
const path = require("node:path");
const { defineConfig } = require("vitest/config");

module.exports = defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    fileParallelism: false,
    setupFiles: ["./src/test/setup.ts"],
  },
});
