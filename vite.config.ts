import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 39143,
    host: true
  },
  build: {
    outDir: 'dist/renderer',
    assetsDir: 'assets'
  }
});