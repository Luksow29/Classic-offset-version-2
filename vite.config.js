import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';
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
        }
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
});
