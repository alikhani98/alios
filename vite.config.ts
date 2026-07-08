import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const srcDir = path.resolve(process.cwd(), "src");

export default defineConfig(({ mode }) => ({
  base: mode === "development" ? "/" : "/alios/",
  plugins: [react()],
  resolve: {
    alias: {
      "@": srcDir,
    },
  },
}));
