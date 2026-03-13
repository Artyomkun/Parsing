module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      if (webpackConfig.devServer) {
        delete webpackConfig.devServer.onAfterSetupMiddleware;
        delete webpackConfig.devServer.onBeforeSetupMiddleware;
        webpackConfig.devServer.setupMiddlewares = (middlewares) => {
          return middlewares;
        };
      }
      return webpackConfig;
    }
  }
};