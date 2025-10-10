import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

const sharedPath = path.resolve(__dirname, 'shared');

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      template: 'treemap', // or 'sunburst'
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'analyse.html', // output file name
    }),
  ],
  server: {
    hmr: {
      clientPort: process.env.PORT ? parseInt(process.env.PORT) : 5173,
      protocol: 'wss',
      host: '0.0.0.0'
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
