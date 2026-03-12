import path from 'path';
import webpack from 'webpack';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import TerserPlugin from 'terser-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config(); // читаем .env

const distMyApp = path.resolve(__dirname, 'dist', 'my-dynamic-site');

const createConfigs = async (): Promise<webpack.Configuration[]> => {
  const configs: webpack.Configuration[] = [];

  // динамически импортируем дополнительные конфиги
  for (const name of [
    'webpack.main.config.ts',
    'webpack.preload.config.ts',
    'webpack.renderer.config.ts',
    'webpack.myapp.config.ts',
    'webpack.server.config.ts',
  ]) {
    try {
      const mod = await import(`./${name}`);
      if (mod) configs.push(mod.default ?? mod);
    } catch (e) {
      console.warn(`${name} не найден или содержит ошибку:`, e);
    }
  }

  // Добавляем конфиг для Node-сервера
  configs.push({
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    target: 'node',
    entry: path.resolve(__dirname, 'server', 'server.ts'),
    output: {
      filename: 'server.js',
      path: path.resolve(__dirname, 'dist', 'server'),
    },
    resolve: {
      extensions: ['.ts', '.js', '.node'],
      alias: {
        '@server': path.resolve(__dirname, 'server'),
        '@myDynamicSite': path.resolve(__dirname, 'my-dynamic-site'),
        '@myappDist': distMyApp,
      },
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                configFile: 'tsconfig.json',
                transpileOnly: true,
                compilerOptions: { emitDeclarationOnly: false },
              },
            },
          ],
          exclude: /node_modules/,
        },
      ],
    },
    externals: [
      '@mongodb-js/zstd',
      'kerberos',
      'mongodb-client-encryption',
      'snappy',
      'express',
      ({ request }, callback) => {
        if (request && /\.node$/.test(request)) {
          return callback(null, 'commonjs ' + request);
        }
        callback();
      },
    ],
    plugins: [
      new webpack.DefinePlugin({
        'process.env.ELECTRON': JSON.stringify('true'),
      }),
    ],
    node: {
      __dirname: true,
      __filename: true,
    },
    stats: {
      warningsFilter: [/Critical dependency: the request of a dependency is an expression/],
      errorDetails: true,
      children: true
    },
    optimization: {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          terserOptions: {
            ecma: 2020,
            parse: { ecma: 2020 },
            compress: { ecma: 2020 },
            mangle: { properties: false },
          },
        }),
      ],
    },
  });

  return configs;
};

export default createConfigs;
