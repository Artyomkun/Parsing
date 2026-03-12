import { defineConfig } from 'vite';
import * as path from 'path';
import { builtinModules } from 'module';
import pkg from './package.json' assert { type: 'json' };

// builtins (plain) и node:prefixed
const builtinPlain = builtinModules.slice();
const builtinWithNodePrefix = builtinModules.map((m) => `node:${m}`);

// дополнительно вынести пакеты, которые должны выполняться в Node (не бандлить)
const extraNodeExternals = [
  'electron',
  'better-sqlite3',
  'sqlite3',
  'node-addon-api',
  'fsevents',
  'puppeteer-core',
  '@puppeteer/browsers',
  '@puppeteer/browsers/lib/esm',
  'proxy-agent',
  'proxy-from-env'
];

// все зависимости из package.json тоже считаем external
const deps = Object.keys(pkg.dependencies || {});

// helper: функция для rollup external (поддерживает id и относительные импорты)
function isExternal(id: string) {
  if (!id) return false;
  // node: prefixed and builtins
  if (builtinWithNodePrefix.includes(id) || builtinPlain.includes(id)) return true;
  // exact package names
  if (extraNodeExternals.some((p) => id === p || id.startsWith(`${p}/`))) return true;
  // package.json deps
  if (deps.some((d) => id === d || id.startsWith(`${d}/`))) return true;
  // node modules absolute/relative — leave false (we want relative imports to be bundled if inside project)
  return false;
}

export default defineConfig({
  build: {
    outDir: 'dist/main',
    target: 'node',             // electron main -> целимся в Node (укажи нужную версию)
    platform: 'node',             // не влияет на vite, но читабельно (для rollup target)
    lib: {
      entry: path.resolve(__dirname, 'server/MyApp/src/main/main.ts'),
      formats: ['cjs'],
      fileName: 'main'
    },
    rollupOptions: {
      external: (id: string) => isExternal(id),
      output: {
        entryFileNames: '[name].cjs',
        // preserve shebang, interop и т.д. по желанию:
        globals: { electron: 'electron' },
      }
    },
    emptyOutDir: true,
    minify: process.env.NODE_ENV === 'production',
    // при проблемах с CommonJS-модулями:
    commonjsOptions: {
      transformMixedEsModules: true
    }
  },
  resolve: {
    alias: {
      '@main': path.resolve(__dirname, 'server/MyApp/src/main')
    }
  },
  ssr: {
    external: [...builtinPlain, ...builtinWithNodePrefix, ...extraNodeExternals, ...deps]
  }
});
