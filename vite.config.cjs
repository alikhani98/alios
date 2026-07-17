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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) {
            return;
          }

          if (
            id.includes("react-router") ||
            id.includes("react-dom") ||
            /[\\/]react[\\/]/.test(id)
          ) {
            return "react-vendor";
          }

          if (id.includes("lucide-react")) {
            return "icons-vendor";
          }

          if (id.includes("date-fns")) {
            return "date-vendor";
          }

          if (
            id.includes("react-hook-form") ||
            id.includes("@hookform") ||
            id.includes("zod")
          ) {
            return "forms-vendor";
          }
        },
      },
    },
  },
}));
