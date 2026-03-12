import { defineConfig } from 'vite';

export default defineConfig({
  // Общие настройки
  root: '.', 
  base: './', 
  server: {
    port: 39143, 
    open: true, 
  },
  build: {
    outDir: 'dist', 
    sourcemap: true, 
  },
});