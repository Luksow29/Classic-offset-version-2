import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

const sharedPath = path.resolve(__dirname, "../../shared");

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 3001, // Customer portal port (main app uses different port)
    fs: {
      allow: [
        // Allow current project directory
        path.resolve(__dirname),
        // Allow shared directory
        sharedPath,
        // Allow node_modules
        path.resolve(__dirname, "node_modules"),
      ],
    },
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": sharedPath,
    },
  },
});
