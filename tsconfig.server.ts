// D:\Parsing-main\tsconfig.devolper.ts

const config = {
  compilerOptions: {
    target: 'ESNext',                 // Цель — современный JavaScript
    module: 'ESNext',                 // Модульная система
    moduleResolution: 'Node',         // Разрешение модулей
    strict: true,                     // Включение строгой типизации
    esModuleInterop: true,            // Совместимость с CommonJS
    skipLibCheck: true,               // пропуск проверки типов библиотек
    forceConsistentCasingInFileNames: true,
    outDir: './dist',                 // Папка для выхода сборки
    rootDir: './server/MyApp/src',    // Корень исходных файлов
    sourceMap: true,                  // Включение sourcemaps
  },
  include: ['./server/MyApp/src'],   // Включить все файлы из src
  exclude: ['node_modules', 'dist'], // Исключить папки
};

export default config;