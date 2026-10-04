import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "dist-cloth",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        cloth: fileURLToPath(new URL("./cloth.html", import.meta.url)),
      },
    },
  },
});
