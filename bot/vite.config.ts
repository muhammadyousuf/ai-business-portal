import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Dev:   `vite` serves index.html (the playground restaurant site) with the widget mounted from src/embed.ts.
// Build: a single self-contained IIFE, dist/widget.js, that any website loads with one <script> tag.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  define: command === "build" ? { "process.env.NODE_ENV": JSON.stringify("production") } : {},
  build: {
    lib: { entry: "src/embed.ts", name: "AssistFlow", formats: ["iife"], fileName: () => "widget.js" },
    cssCodeSplit: false,
    sourcemap: true,
    rollupOptions: { output: { inlineDynamicImports: true } },
  },
}));
