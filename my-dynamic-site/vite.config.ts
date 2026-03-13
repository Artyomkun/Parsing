import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  clearScreen: false,
  logLevel: 'info', // или 'debug'
  server: {
    proxy: {
      '/api': {
        target: 'https://localhost:49144',
        changeOrigin: true,
        secure: false,
        configure(proxy) {
          proxy.on('proxyReq', (proxyReq, req) => {
            console.log('[proxyReq]', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            console.log('[proxyRes]', req.method, req.url, proxyRes.statusCode);
          });
          proxy.on('error', (err, req) => {
            console.error('[proxyError]', req.method, req.url, err.message);
          });
        },
      },
    },
  },
  plugins: [react(), nodePolyfills()],
  resolve: {
    alias: {
      util: 'util',
      'node:util': 'util',
      buffer: 'buffer',
      'node:buffer': 'buffer',
      process: 'process/browser',
      events: 'events',
      'node:events': 'events',
      stream: 'stream-browserify',
      'node:stream': 'stream-browserify',
      timers: 'timers-browserify',
      'node:timers': 'timers-browserify',
      assert: 'assert',
      crypto: 'crypto-browserify',
    },
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    include: ['util', 'buffer', 'process', 'events', 'stream-browserify', 'timers-browserify', 'assert', 'crypto-browserify'],
  },
});