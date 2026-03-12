// webpack.preload.config.ts
import path from 'path';
import webpackPkg from 'webpack';
const { Configuration } = webpackPkg;
import { fileURLToPath } from 'url';

// Получаем текущий файл и директорию
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const preloadConfig: Configuration = {
  mode: 'production',
  target: 'electron-preload',
  entry: path.resolve(__dirname, 'server/MyApp/src/main/preload/preload.ts'),
  output: {
    filename: 'preload.js',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  stats: {
    errorDetails: true,
    children: true
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
    ],
  },
  node: {
    __dirname: true,
    __filename: true,
  },
  devtool: 'source-map',
};

export default preloadConfig;