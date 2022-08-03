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
  build: {
    lib: {
      entry: resolve(__dirname, "tslox/main.ts"),
      name: "tslox",
      // the proper extensions will be added
      fileName: "tslox",
    },
    rollupOptions: {
      // make sure to externalize deps that shouldn't be bundled
      // into your library
      external: [],
      output: {
        // Provide global variables to use in the UMD build
        // for externalized deps
        globals: {},
      },
    },
  },
});
