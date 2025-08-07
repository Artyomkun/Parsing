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