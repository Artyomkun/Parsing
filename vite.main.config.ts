<<<<<<< HEAD
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
=======
// vite.main.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { builtinModules } from 'node:module';

export default defineConfig(({ mode }) => ({
  // Конфигурация сборки для главного процесса Electron
  build: {
    // Выходная директория для файлов главного процесса
    outDir: resolve(__dirname, 'dist/main'),
    
    // Конфигурация библиотеки
    lib: {
      // Точка входа главного процесса
      entry: resolve(__dirname, 'src/main/main.ts'),
      
      // Формат вывода - CommonJS (Electron пока не полностью поддерживает ESM)
      formats: ['cjs'],
      
      // Имя выходного файла
      fileName: () => 'main.js'
    },
    
    // Настройки Rollup
    rollupOptions: {
      // Внешние зависимости, которые не должны включаться в бандл
      external: [
        'electron',
        ...builtinModules,
        ...builtinModules.map(m => `node:${m}`)
      ],
      
      // Настройки вывода
      output: {
        // Формат имен файлов для точек входа
        entryFileNames: '[name].js',
        
        // Формат имен файлов для чанков
        chunkFileNames: '[name]-[hash].js',
        
        // Формат имен для ассетов
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    
    // Минификация в production режиме
    minify: mode === 'production',
    
    // Генерация sourcemap для отладки
    sourcemap: mode !== 'production',
    
    // Очистка выходной директории перед сборкой
    emptyOutDir: false
  },
  
  // Отключаем предупреждения о встроенных модулях
  define: {
    'process.env.FORCE_COLOR': 'true',
    'process.env.NODE_ENV': JSON.stringify(mode)
  },
  
  // Отключаем HMR для главного процесса
  server: {
    hmr: false
  },
  
  // Разрешение модулей
  resolve: {
    // Псевдонимы путей
    alias: {
      '@main': resolve(__dirname, 'src/main'),
      '@shared': resolve(__dirname, 'src/shared')
    }
  }
}));
>>>>>>> 6d9ece145be331bb2f202013f3c4ed3b01bd3cd1
