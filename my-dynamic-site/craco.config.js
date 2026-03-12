import webpack from 'webpack';

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Добавляем полифиллы для Node.js модулей
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "react": require.resolve("react"),
        "react-dom": require.resolve("react-dom"),
        "react-router-dom": require.resolve("react-router-dom"),
        "react-router": require.resolve("react-router"),
        "react-dom/client": require.resolve("react-dom/client"),
        "react-router-dom/client": require.resolve("react-router-dom/client"),
        "react-router-dom/server": require.resolve("react-router-dom/server"),
        "react-router-dom/server/unstable_react-dev-middleware": require.resolve("react-router-dom/server/unstable_react-dev-middleware"),
        "react-router-dom/server/unstable_react-dev-middleware/client": require.resolve("react-router-dom/server/unstable_react-dev-middleware/client"),
        "react-router-dom/server/unstable_react-dev-middleware/server": require.resolve("react-router-dom/server/unstable_react-dev-middleware/server"),
        "react-router-dom/server/unstable_react-dev-middleware/shared": require.resolve("react-router-dom/server/unstable_react-dev-middleware/shared"),
        "react-router-dom/server/unstable_react-dev-middleware/shared/server": require.resolve("react-router-dom/server/unstable_react-dev-middleware/shared/server"),
        "react-router-dom/server/unstable_react-dev-middleware/shared/client": require.resolve("react-router-dom/server/unstable_react-dev-middleware/shared/client"),
        "timers": require.resolve("timers-browserify"),
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer"),
        "process": require.resolve("process/browser"),
        "util": require.resolve("util"),
        "assert": require.resolve("assert"),
        "crypto": require.resolve("crypto-browserify"),
        "fs": false,
        "path": false,
        "os": false
      };
      // Добавляем полифиллы для Node.js модулей
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "react": require.resolve("react"),
        "react-dom": require.resolve("react-dom"),
        "react-router-dom": require.resolve("react-router-dom"),
        "react-router": require.resolve("react-router"),
        "react-dom/client": require.resolve("react-dom/client"),
        "react-router-dom/client": require.resolve("react-router-dom/client"),
        "react-router-dom/server": require.resolve("react-router-dom/server"),
        "react-router-dom/server/unstable_react-dev-middleware": require.resolve("react-router-dom/server/unstable_react-dev-middleware"),
        "react-router-dom/server/unstable_react-dev-middleware/client": require.resolve("react-router-dom/server/unstable_react-dev-middleware/client"),
        "react-router-dom/server/unstable_react-dev-middleware/server": require.resolve("react-router-dom/server/unstable_react-dev-middleware/server"),
        "react-router-dom/server/unstable_react-dev-middleware/shared": require.resolve("react-router-dom/server/unstable_react-dev-middleware/shared"),
        "react-router-dom/server/unstable_react-dev-middleware/shared/server": require.resolve("react-router-dom/server/unstable_react-dev-middleware/shared/server"),
        "react-router-dom/server/unstable_react-dev-middleware/shared/client": require.resolve("react-router-dom/server/unstable_react-dev-middleware/shared/client"),
        "timers": require.resolve("timers-browserify"),
        "stream": require.resolve("stream-browserify"),
        "buffer": require.resolve("buffer"),
        "process": require.resolve("process/browser"),
        "util": require.resolve("util"),
        "assert": require.resolve("assert"),
        "crypto": require.resolve("crypto-browserify"),
        "fs": false,
        "path": false,
        "os": false
      };
      // Добавляем плагины
      webpackConfig.plugins.push(
        new webpack.ProvidePlugin({
          Buffer: ['buffer', 'Buffer'],
          process: 'process/browser',
        })
      );
      return webpackConfig;
    },
  },
};
