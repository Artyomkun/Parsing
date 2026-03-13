/// <reference types="vite/client" />

// Декларации для переменных окружения Vite
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string;
  readonly VITE_API_URL: string;
  // Добавьте другие переменные окружения здесь
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Декларация для модулей CSS (если нужно)
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
}

// Декларация для SVG (если используете)
declare module '*.svg' {
  import React = require('react');
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>;
  const src: string;
}