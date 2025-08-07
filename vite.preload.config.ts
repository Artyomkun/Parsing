// vite.preload.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { builtinModules } from 'node:module';

export default defineConfig(({ mode }) => ({
  build: {
    outDir: resolve(__dirname, 'dist/preload'),
    lib: {
      entry: resolve(__dirname, 'src/preload/preload.ts'),
      formats: ['cjs'],
      fileName: () => 'preload.js'
    },
    rollupOptions: {
      external: [
        'electron',
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`)
      ],
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    minify: mode === 'production',
    sourcemap: mode !== 'production',
    emptyOutDir: false
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode)
  },
  resolve: {
    alias: {
      '@preload': resolve(__dirname, 'src/preload'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  }
}));