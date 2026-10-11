// Gera uma versão de página única do Home Leal (sem servidor), útil para pré-visualização pessoal.
// Uso: npm run build:standalone  →  standalone/dist/home-leal.html
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  root: r("."),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^next\/link$/, replacement: r("./shims/next-link.tsx") },
      { find: /^next\/navigation$/, replacement: r("./shims/next-navigation.ts") },
      { find: /^@\//, replacement: r("../src/") + "/" },
    ],
  },
  build: {
    outDir: r("./dist"),
    emptyOutDir: true,
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: { output: { codeSplitting: false } },
  },
});
