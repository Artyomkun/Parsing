require('tsx/cjs');

const serverConfig = require('./webpack.server.config.cts');
const myAppConfig = require('./webpack.myapp.config.cts');

module.exports = [
    serverConfig,
    myAppConfig,
];