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
