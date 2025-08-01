import { defineConfig } from 'vite';
import path from 'node:path';

export default defineConfig({
  build: {
    outDir: 'dist/main',
    lib: {
      entry: path.resolve(__dirname, 'electron/main.ts'),
      formats: ['cjs'],
    },
  },
});