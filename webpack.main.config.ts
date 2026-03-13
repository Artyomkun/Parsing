// webpack.main.config.ts
import path from 'path';
import webpackPkg from 'webpack';
const { Configuration } = webpackPkg;
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const mainConfig: Configuration = {
  mode: 'production',
  target: 'electron-main',
  entry: path.resolve(__dirname, 'server/MyApp/src/main/main.ts'),
  output: {
    filename: 'main.js',
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

export default mainConfig;
