import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
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
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png', 'robots.txt'],
      manifest: false, // Use static manifest.json from public folder
      workbox: {
        // Workbox's production minification uses Rollup+Terser; disable it for compatibility.
        mode: 'development',
        disableDevLogs: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": sharedPath,
    },
  },
});
