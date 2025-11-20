import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/api/verify-turnstile": {
        target: "https://nmsbskifihjxwdqeqgpk.supabase.co/functions/v1/verify-turnstile",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/verify-turnstile/, ""),
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
