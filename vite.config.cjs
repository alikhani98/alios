// This CommonJS config is a temporary Windows config-loading workaround because TS/MJS configs fail in this workspace with an esbuild access-denied loader error.
const path = require("node:path");
const react = require("@vitejs/plugin-react");
const { defineConfig } = require("vite");

module.exports = defineConfig(({ mode }) => ({
  base: mode === "development" ? "/" : "/alios/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
}));
