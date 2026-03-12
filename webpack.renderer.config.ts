// webpack.renderer.config.ts
import path from 'path';
import webpackPkg from 'webpack';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import { fileURLToPath } from 'url';

const { Configuration } = webpackPkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isDevelopment = process.env.NODE_ENV !== 'production';

const rendererConfig: Configuration = {
  mode: isDevelopment ? 'development' : 'production',
  target: 'electron-renderer',
  entry: {
    renderer: './src/renderer', 
  },
  output: {
    filename: isDevelopment ? '[name].js' : '[name].[contenthash].js',
    path: path.resolve(__dirname, 'dist'),
    publicPath: './',
    clean: true, // Clean output directory before emit
  },
  stats: {
    errorDetails: true,
    children: true,
    colors: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
    alias: {
      '@': path.resolve(__dirname, 'src/renderer'), // Optional path alias
    },
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader',
          options: {
            transpileOnly: isDevelopment, // Faster builds in development
          },
        },
      },
      {
        test: /\.css$/,
        use: [
          isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
          'css-loader',
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[hash][ext][query]',
        },
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin({
      filename: isDevelopment ? '[name].css' : '[name].[contenthash].css',
    }),
    isDevelopment && new ReactRefreshWebpackPlugin(),
  ].filter(Boolean),
  devtool: isDevelopment ? 'eval-source-map' : 'source-map',
  optimization: {
    splitChunks: {
      chunks: 'all',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all',
        },
      },
    },
  },
  cache: {
    type: 'filesystem', // Improved build performance
    buildDependencies: {
      config: [__filename],
    },
  },
};

export default rendererConfig;