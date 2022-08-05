import { resolve } from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@test": resolve(__dirname, "./test-bench"),
      "@lib": resolve(__dirname, "./tslox"),
    },
  },
  define: {
    global: {},
  },
});
