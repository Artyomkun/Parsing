import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
<<<<<<< HEAD
import * as path from 'path';
import fs from 'fs';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import devConfig from 'vite.server.config';

// Путь для вывода HTML
const outDir = path.resolve(__dirname, '../dist/server/MyApp/src/main');

// Создаем каталог и HTML при сборке
const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Electron App</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="main.ts"></script>
</body>
</html>`;
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'index.html'), htmlContent);


export default defineConfig({
  ...devConfig,
  plugins: [
    ...(devConfig.plugins || []),
    react(),
    nodePolyfills({
      include: [
        'path', 'fs', 'url', 'stream', 'crypto', 'http', 'https', 'os',
        'child_process', 'net', 'tls', 'dns', 'zlib', 'assert', 'process'
      ],
      globals: { Buffer: true },
    }),
  ],
  define: {
    ...(devConfig.define || {}),
    global: 'globalThis',
    'process.env': process.env,
    'process.platform': JSON.stringify('linux'), // Можете менять в зависимости от платформы
  },
  resolve: {
    ...(devConfig.resolve || {}),
    alias: {
      ...(devConfig.resolve?.alias || {}),
      // Алиасы для Node.js модулей
      'node:url': path.resolve(__dirname, 'node_modules/url/'),
      'node:path': path.resolve(__dirname, 'node_modules/path-browserify'),
      'node:crypto': path.resolve(__dirname, 'node_modules/crypto-browserify'),
      'node:fs': 'memfs', // Полезно для браузера
      'node:os': path.resolve(__dirname, 'node_modules/os-browserify/browser'),
      'node:http': path.resolve(__dirname, 'node_modules/http-browserify'),
      'node:https': path.resolve(__dirname, 'node_modules/https-browserify'),
      'proxy-agent': path.resolve(__dirname, 'node_modules/proxy-agent/browser.js'),
      'puppeteer-core': path.resolve(__dirname, 'node_modules/puppeteer-core/lib/esm/puppeteer-core.js'),
    }
  },
  build: {
    ...devConfig.build,
    outDir,
    target: 'esnext', // Поддержка последних стандартов, подходит для Electron
    rollupOptions: {
      ...(devConfig.build?.rollupOptions || {}),
      input: {
        main: path.resolve(__dirname, 'index.html'), // Основной HTML
        preload: preloadPath, // Preload скрипт
      },
      external: [
        'electron', 'path', 'fs', 'os', 'http', 'https', 'stream', 'crypto', 'child_process', 'net', 'tls', 'dns', 'zlib', 'assert', 'process'
      ],
      output: {
        ...(devConfig.build?.rollupOptions?.output || {}),
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  server: {
    port: 39143,
    strictPort: true,
    hmr: false,
  },
=======
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
>>>>>>> 6d9ece145be331bb2f202013f3c4ed3b01bd3cd1
});