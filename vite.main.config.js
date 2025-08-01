import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main/index.js'),
      formats: ['cjs'], 
      fileName: 'index',
    },
    outDir: path.resolve(__dirname, 'dist/main'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});