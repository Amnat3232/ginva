import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
  },
  define: {
    global: "globalThis",
  },
  optimizeDeps: {
    include: ["@solana/web3.js", "@project-serum/anchor"],
  },
});
