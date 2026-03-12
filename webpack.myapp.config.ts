import path from 'path';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const isProduction = process.env.NODE_ENV === 'production';

const myAppConfig: webpack.Configuration = {
  mode: isProduction ? 'production' : 'development',
  target: 'web',
  entry: path.resolve(__dirname, 'server', 'MyApp', 'index.tsx'),
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist', 'my-dynamic-site'),
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js'],
  },
  stats: {
    errorDetails: true,
    children: true
  },
  module: {
    rules: [
      { test: /\.tsx?$/, use: 'ts-loader', exclude: /node_modules/ },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
      APP_PORT: JSON.stringify(34144),
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: path.resolve(__dirname, 'my-dynamic-site', 'public'), to: '.' },
      ],
    }),
  ],
  devtool: isProduction ? false : 'source-map',
  optimization: { minimize: isProduction },
};

export default myAppConfig;