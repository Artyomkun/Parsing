import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/renderer': path.resolve(__dirname, 'src/renderer'),
      '@/main': path.resolve(__dirname, 'src/main'),
      '@/preload': path.resolve(__dirname, 'src/preload')
    }
  },
  server: {
    port: 39143,
    strictPort: true
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      // Множественные точки входа для Electron
      input: {
        main: path.resolve(__dirname, 'src/main/main.ts'),
        preload: path.resolve(__dirname, 'src/preload/preload.ts'),
        renderer: path.resolve(__dirname, 'src/renderer/index.html')
      },
      output: {
        // Для main и preload используем CommonJS
        format: (chunkInfo) => {
          return ['main', 'preload'].includes(chunkInfo.name) ? 'cjs' : 'es';
        },
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'renderer' 
            ? 'renderer/assets/[name]-[hash].js' 
            : '[name].js';
        },
        chunkFileNames: 'renderer/assets/[name]-[hash].js',
        assetFileNames: 'renderer/assets/[name]-[hash][extname]',
        manualChunks(id) {
          if (id.includes('node_modules')) {
            const packageName = id.split('node_modules/')[1].split('/')[0];
            
            if (packageName.includes('lodash')) {
              return 'vendor-lodash';
            }
            if (packageName.includes('d3')) {
              return 'vendor-d3';
            }
            if (packageName.includes('three')) {
              return 'vendor-three';
            }
            if (packageName.includes('react')) {
              return 'vendor-react';
            }
            if (packageName.includes('electron')) {
              return 'vendor-electron';
            }
            
            return 'vendor';
          }
          if (id.includes('src/renderer')) {
            return 'renderer';
          }
          if (id.includes('src/lib')) {
            return 'core-lib';
          }
        }
      }
    }
  },
  // Оптимизация зависимостей для Electron
  optimizeDeps: {
    include: [
      'electron',
      'path',
      'fs',
      'axios',
      'cheerio',
      'puppeteer-core'
    ],
    exclude: [
      'electron-reload'
    ]
  }
});