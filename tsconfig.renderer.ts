import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 39143,
    host: true
  },
  build: {
<<<<<<< HEAD
    outDir: '../dist/server/MyApp/src/main/renderer',
=======
    outDir: 'dist/renderer',
>>>>>>> 6d9ece145be331bb2f202013f3c4ed3b01bd3cd1
    assetsDir: 'assets'
  }
});