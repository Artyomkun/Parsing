import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: path.resolve(__dirname, 'dist/server/MyApp/src/preload/preload.ts'),
    lib: {
      entry: path.resolve(__dirname, 'server/MyApp/src/preload/preload.ts'),
      formats: ['es'], 
      fileName: "preload"
    },
    rollupOptions: {
      external: ['electron'],
      output: {
        entryFileNames: '[name].mjs' 
      }
    }
  }
});