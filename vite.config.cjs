// vite.config.mjs
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      filename: 'bundle-analysis.html',
      gzipSize: true
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/renderer': path.resolve(__dirname, 'src/renderer')
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  },
  server: {
    port: 39143,
    strictPort: true
  },
  build: {
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const packageName = id.split('node_modules/')[1].split('/')[0];
            if (packageName.includes('lodash')) return 'vendor-lodash';
            if (packageName.includes('d3')) return 'vendor-d3';
            return 'vendor';
          }
        }
      }
    }
  }
});