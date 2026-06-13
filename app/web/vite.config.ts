import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return;
          if (id.includes("react-dom") || id.includes("/react/")) {
            return "react";
          }
          if (id.includes("@coral-xyz")) {
            return "anchor";
          }
          if (id.includes("@solana/wallet-adapter")) {
            return "wallets";
          }
          if (id.includes("@solana")) {
            return "solana";
          }
          if (id.includes("framer-motion")) {
            return "motion";
          }
          if (id.includes("@walletconnect") || id.includes("@reown")) {
            return "walletconnect";
          }
          return "vendor";
        },
      },
    },
  },
  define: {
    "process.env": {},
    global: "globalThis",
  },
  resolve: {
    alias: {
      buffer: "buffer/",
    },
  },
});
