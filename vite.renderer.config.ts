import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
<<<<<<< HEAD
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
=======
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, 'dist/renderer'),
    emptyOutDir: true,
  },
  server: {
    port: 39143,
    host: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@renderer': path.resolve(__dirname, 'src/renderer'),
    },
  },
  // Add this optimizeDeps section
  optimizeDeps: {
    include: [
      'json2csv',
      'xml2js',
      'js-yaml',
      'ini',
      'json2xml',
      'papaparse'
    ],
    exclude: ['electron']
  }
});
>>>>>>> 6d9ece145be331bb2f202013f3c4ed3b01bd3cd1
