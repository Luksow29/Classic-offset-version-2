import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

const sharedPath = path.resolve(__dirname, 'shared');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt', // prompt for update instead of autoUpdate to prevent unexpected reloads
      includeAssets: ['icons/*.png', 'robots.txt', 'manifest.json'],
      manifest: false, // Use static manifest.json from public folder
      workbox: {
        // Workbox's production minification uses Rollup+Terser; disable it for compatibility.
        mode: 'development',
        disableDevLogs: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    }),
    visualizer({
      template: 'treemap',
      open: false,
      gzipSize: true,
      brotliSize: true,
      filename: 'analyse.html',
    }),
  ],
  server: {
    hmr: {
      clientPort: process.env.PORT ? parseInt(process.env.PORT) : 5173,
      protocol: (process.env.HMR_PROTOCOL as 'ws' | 'wss') || 'ws',
      host: process.env.HMR_HOST || 'localhost',
    },
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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@shared': sharedPath,
      '@classic-offset/shared': sharedPath,
    },
    dedupe: ['react', 'react-dom'],
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
  },
  worker: {
    format: 'es',
  },
});
