const path = require('path');
const webpack = require('webpack');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const fs = require('fs');

const isDevelopment = process.env.NODE_ENV !== 'production';

function createCommon() {
  return {
    mode: isDevelopment ? 'development' : 'production',
    devtool: isDevelopment ? 'eval-source-map' : 'source-map',
    stats: {
      errorDetails: true,
      children: true,
      colors: true,
    },
    cache: {
      type: 'filesystem',
      buildDependencies: {
        config: [__filename],
      },
    },
  };
}

function createMainConfig() {
  const common = createCommon();
  return {
    ...common,
    name: 'main',
    target: 'electron-main',
    entry: {
      main: path.resolve(__dirname, 'server', 'MyApp', 'src', 'main', 'main.ts'),
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].bundle.js',
    },
    resolve: {
      extensions: ['.ts', '.js', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: isDevelopment,
            },
          },
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
        'process.env.ELECTRON': JSON.stringify('true'),
        'process.env.DEV': JSON.stringify(isDevelopment),
      }),
    ],
    externals: {
      electron: 'commonjs2 electron',
      'original-fs': 'commonjs2 original-fs',
      'puppeteer-core': 'commonjs2 puppeteer-core',
    },
    node: {
      __dirname: isDevelopment,
      __filename: isDevelopment,
    },
  };
}

function createPreloadConfig() {
  const common = createCommon();
  return {
    ...common,
    name: 'preload',
    target: 'electron-preload',
    entry: {
      preload: path.resolve(__dirname, 'server', 'MyApp', 'src', 'preload', 'preload.ts'),
    },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: '[name].bundle.js',
    },
    resolve: {
      extensions: ['.ts', '.js', '.json'],
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: isDevelopment,
            },
          },
          exclude: /node_modules/,
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
        'process.env.ELECTRON': JSON.stringify('true'),
        'process.env.DEV': JSON.stringify(isDevelopment),
      }),
    ],
    node: {
      __dirname: false,
      __filename: false,
    },
  };
}

function createRendererConfig() {
  const common = createCommon();

  // Ищем точку входа - сначала в my-dynamic-site, потом в других местах
  const possibleRendererEntries = [
    path.resolve(__dirname, 'my-dynamic-site', 'src', 'index.tsx'),
    path.resolve(__dirname, 'my-dynamic-site', 'src', 'index.ts'),
    path.resolve(__dirname, 'my-dynamic-site', 'src', 'index.jsx'),
    path.resolve(__dirname, 'my-dynamic-site', 'src', 'index.js'),
    path.resolve(__dirname, 'my-dynamic-site', 'index.tsx'),
    path.resolve(__dirname, 'my-dynamic-site', 'index.ts'),
    path.resolve(__dirname, 'src', 'renderer', 'index.tsx'),
    path.resolve(__dirname, 'src', 'renderer', 'index.ts'),
    path.resolve(__dirname, 'server', 'MyApp', 'src', 'renderer', 'index.tsx'),
  ];

  // Находим существующий entry point
  let rendererEntry = null;
  let siteRoot = null;

  for (const entry of possibleRendererEntries) {
    if (fs.existsSync(entry)) {
      rendererEntry = entry;
      // Определяем корневую папку сайта на основе найденного entry point
      if (entry.includes('my-dynamic-site')) {
        siteRoot = path.dirname(path.dirname(entry)); // поднимаемся на уровень выше src
      } else {
        siteRoot = path.dirname(entry);
      }
      console.log(`Found renderer entry point: ${rendererEntry}`);
      console.log(`Site root: ${siteRoot}`);
      break;
    }
  }

  // Если entry point не найден, создаем простой по умолчанию в my-dynamic-site
  if (!rendererEntry) {
    console.log('Creating default renderer entry point in my-dynamic-site...');
    siteRoot = path.resolve(__dirname, 'my-dynamic-site');
    const srcDir = path.join(siteRoot, 'src');
    rendererEntry = path.join(srcDir, 'index.tsx');
    
    // Создаем директорию src, если она не существует
    if (!fs.existsSync(srcDir)) {
      fs.mkdirSync(srcDir, { recursive: true });
    }
    // Создаем базовый index.tsx, если он не существует
    if (!fs.existsSync(rendererEntry)) {
      fs.writeFileSync(
        rendererEntry,
        `import React from 'react';\nimport ReactDOM from 'react-dom';\n\nReactDOM.render(<div>Hello, World!</div>, document.getElementById('root'));\n`
      );
    }
  } // Closing brace added here to complete the if block

  // Определяем public папку для статических файлов
  const publicDir = path.resolve(__dirname, 'my-dynamic-site', 'public');
  const hasPublicDir = fs.existsSync(publicDir);

  const plugins = [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser.js', // Updated to include .js extension
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
      'process.env.ELECTRON': JSON.stringify('true'),
      'process.env.DEV': JSON.stringify(isDevelopment),
    }),
    isDevelopment && new ReactRefreshWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: isDevelopment ? '[name].css' : '[name].[contenthash].css',
    }),
    new HtmlWebpackPlugin({
      template: hasPublicDir && fs.existsSync(path.join(publicDir, 'index.html'))
        ? path.join(publicDir, 'index.html')
        : defaultTemplatePath,
      filename: 'index.html',
      title: 'My Dynamic Site',
      chunks: ['renderer'],
    }),
  ].filter(Boolean);

  if (hasPublicDir) {
    plugins.push(
      new CopyWebpackPlugin({
        patterns: [
          {
            from: publicDir,
            to: path.resolve(__dirname, 'dist', 'my-dynamic-site'),
            noErrorOnMissing: true,
            globOptions: {
              ignore: ['**/index.html'],
            },
          },
        ],
      })
    );
  }

  return {
    ...common,
    name: 'renderer',
    target: 'web',
    entry: {
      renderer: rendererEntry,
    },
    output: {
      path: path.resolve(__dirname, 'dist', 'my-dynamic-site'),
      filename: isDevelopment ? '[name].bundle.js' : '[name].[contenthash].bundle.js',
      publicPath: isDevelopment ? '/' : './',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.mjs'],
      alias: {
        '@': siteRoot || path.resolve(__dirname, 'my-dynamic-site', 'src'),
        'process/browser': require.resolve('process/browser.js'), // Alias for xlsx
        crypto: 'crypto-browserify',
        stream: 'stream-browserify',
        buffer: 'buffer',
      },
      fallback: {
        process: require.resolve('process/browser.js'), // Fallback for xlsx
        crypto: require.resolve('crypto-browserify'),
        stream: require.resolve('stream-browserify'),
        buffer: require.resolve('buffer'),
        fs: false,
        path: false,
        os: false,
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: {
            loader: 'ts-loader',
            options: {
              transpileOnly: isDevelopment,
            },
          },
          exclude: /node_modules/,
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
        {
          test: /\.mjs$/,
          include: /node_modules/,
          type: 'javascript/auto',
        },
      ],
    },
    performance: {
      hints: "warning", // Отключает предупреждения о размере бандлов
      maxEntrypointSize: 7 * 1024 * 1024, // 1MB
      maxAssetSize: 7 * 1024 * 1024, // 1MB
    },
    plugins,
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
    devServer: isDevelopment
      ? {
          host: '0.0.0.0',
          hot: true,
          port: 34143,
          client: {
            webSocketURL: {
              hostname: 'localhost',
              port: 34144,
            },
          },
          historyApiFallback: true,
          headers: { 'Access-Control-Allow-Origin': '*' },
          static: {
            directory: path.join(__dirname, 'my-dynamic-site/index.html' ),
          },
          devMiddleware: {
            writeToDisk: true,
          },
        }
      : undefined,
  };
}

module.exports = async function () {
  const mainConfig = createMainConfig();
  const preloadConfig = createPreloadConfig();
  const rendererConfig = createRendererConfig();

  // Remove unused myAppConfig and serverConfig
  return [mainConfig, preloadConfig, rendererConfig].filter(Boolean);
};