import path from "path";
import { fileURLToPath } from "url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // vite-plugin-singlefile is meant for production builds; in dev it can confuse import analysis.
  // Disable fast refresh to avoid html-proxy mismatch under `vercel dev`.
  plugins: [react({ fastRefresh: false }), tailwindcss(), command === "build" ? viteSingleFile() : undefined].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  /** Jalankan `npm run dev` lalu buka URL yang ditampilkan (biasanya http://localhost:5173). */
  server: {
    port: 5173,
    strictPort: false,
    host: "localhost",
    open: true,
  },
  /** Setelah `npm run build`, preview build produksi: `npm run preview`. */
  preview: {
    port: 4173,
    strictPort: false,
    host: "localhost",
    open: true,
  },
}));
