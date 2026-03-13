import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@server': 'D:/Parsing-main/server',
      '@myapp': 'D:/Parsing-main/server/MyApp'
    }
  },
  main: {
    entry: path.resolve(__dirname, 'server/MyApp/src/main/main.ts'),
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        external: ['puppeteer-core']
      }
    },
    preload: path.resolve(__dirname, 'server/MyApp/src/preload/preload.ts'), 
  },
  renderer: {
    entry: path.resolve(__dirname, 'server/MyApp/src/renderer'), 
    plugins: [react()],
    build: {
      rollupOptions: {
        external: ['crypto']
      }
    },
    optimizeDeps: {
      exclude: ['crypto']
    }
  }
});