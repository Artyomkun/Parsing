// eslint.config.mjs
import { defineConfig } from "eslint-define-config";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: path.join(__dirname, "tsconfig.json"), // путь к tsconfig для MTS
    tsconfigRootDir: __dirname,
    sourceType: "module",
    ecmaVersion: 2025,
    ecmaFeatures: {
      jsx: true, // если есть React
    },
  },
  env: {
    browser: true,
    node: true,
    es2025: true,
  },
  plugins: ["@typescript-eslint", "react", "react-hooks"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
  ],
  settings: {
    react: {
      version: "detect",
    },
  },
  rules: {
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off",
  },
});
