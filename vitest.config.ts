/// <reference types="vitest" />
import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    css: false,
    include: ["tests/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      reporter: ["text", "html"],
      include: ["src/lib/**/*.ts", "src/store.tsx"],
    },
  },
});
