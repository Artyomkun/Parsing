import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import commonjs from 'vite-plugin-commonjs';

export default defineConfig({
  plugins: [
    react(),
    commonjs({
      filter(id) {
        // Обрабатываем только нужные пакеты
        return /node_modules\/(xml2js|js-yaml|ini|json2xml|cheerio)/.test(id);
      }
    })
  ],
  server: {
    port: 39143,
    host: true
  },
  build: {
    outDir: 'dist/renderer',
    assetsDir: 'assets',
    rollupOptions: {
      external: ['electron'], // Исключаем Electron из сборки
    }
  },
  optimizeDeps: {
    include: [
      'xml2js',
      'js-yaml',
      'ini',
      'json2xml',
      'papaparse',
      'cheerio',
      'json2csv',
    ],
    exclude: ['electron'] // Исключаем Electron
  },
  resolve: {
    alias: {
      '@': '/src', // Алиас для корня проекта
      '@renderer': '/src/renderer' // Алиас для рендерера
    }
  }
});