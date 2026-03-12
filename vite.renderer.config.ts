import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'server/MyApp'),
  publicDir: path.resolve(__dirname, 'server/MyApp/src/main/renderer/public'),
  plugins: [react()],
  server: {
    port: 39143,
    strictPort: true,
    open: false,
    host: true, 
  },
  build: {
    outDir: path.resolve(__dirname, 'dist/server/MyApp/src/main/renderer'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'server/MyApp'),
      '@styles': path.resolve(__dirname, 'server/MyApp/src/renderer/styles'),
      '@components': path.resolve(__dirname, 'server/MyApp/src/renderer/components'),
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  css: {
    modules: {
      localsConvention: 'camelCaseOnly',
    },
    preprocessorOptions: {
      scss: {
        additionalData: `@import "@styles/variables.scss";`
      }
    }
  }
});
