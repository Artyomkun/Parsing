<<<<<<< HEAD
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  build: {
    outDir: path.resolve(__dirname, 'dist/server/MyApp/src/preload/preload.ts'),
    lib: {
      entry: path.resolve(__dirname, 'server/MyApp/src/preload/preload.ts'),
      formats: ['es'], 
      fileName: "preload"
    },
    rollupOptions: {
      external: ['electron'],
      output: {
        entryFileNames: '[name].mjs' 
      }
    }
  }
});
=======
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
>>>>>>> 6d9ece145be331bb2f202013f3c4ed3b01bd3cd1
