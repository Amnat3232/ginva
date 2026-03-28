import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Fix bigint-buffer issue by aliasing to buffer
      "bigint-buffer": "buffer",
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    // Vite 8 (Rolldown) handles code splitting automatically
  },
  define: {
    global: "globalThis",
    "process.env": {},
  },
  optimizeDeps: {
    // Vite 8 uses Rolldown for dependency optimization
    include: [
      "@solana/web3.js",
      "@solana/wallet-adapter-react",
      "@solana/wallet-adapter-react-ui",
      "@solana/wallet-adapter-base",
      "@solana/wallet-adapter-phantom",
      "@solana/wallet-adapter-solflare",
      "buffer",
    ],
  },
});
