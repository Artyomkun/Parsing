const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

const isProduction = process.env.NODE_ENV === 'production';

module.exports = {
    mode : isProduction ? 'production' : 'development',
    target : 'web',
    entry : path.resolve(__dirname, 'MyApp/src/index.tsx'),
    output : {
        filename : 'bundle.js',
        path : path.resolve(__dirname, 'dist', 'MyApp'),
        clean : true,
    },
    resolve : {
        extensions : [ '.ts', '.tsx', '.js' ],
        alias : {
            '@MyApp' : path.resolve(__dirname, 'MyApp'),
            '@server' : path.resolve(__dirname, 'server'),
        },
        fallback : {
            fs : false,
            path : false,
            os : false,
            stream : false,
            buffer : false,
            util : false,
            events : false,
            url : false,
            assert : false,
            zlib : false,
            http : false,
            https : false,
            net : false,
            tls : false,
            child_process : false,
            worker_threads : false,
            module : false,
            timers : false,
        },
    },
    stats : {errorDetails : true, children : true},
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'swc-loader',
                    options: {
                        jsc: {
                            parser: {
                                syntax: 'typescript',
                                tsx: true,
                                decorators: false,
                                dynamicImport: true,
                            },
                            transform: {
                                react: {
                                    runtime: 'automatic',
                                    development: !isProduction,
                                    refresh: false,
                                },
                            },
                            target: 'esnext',
                        },
                    },
                },
            },
        ],
    },
    plugins : [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV' : JSON.stringify(process.env.NODE_ENV || 'development'),
            'process.env.API_URL' : JSON.stringify(process.env.API_URL || 'http://localhost:39143'),
            APP_PORT : JSON.stringify(34144),
        }),
        new HtmlWebpackPlugin({
            templateContent : `<!DOCTYPE html>
<html lang="ru">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Data Parser Pro</title>
    </head>
    <body>
        <div id="root"></div>
    </body>
</html>`,
        }),
    ],
    devtool : isProduction ? false : 'source-map',
    optimization : {minimize : isProduction},
    devServer : {
        port : 3000,
        hot : true,
        open : false,
        historyApiFallback : true,
        static : {
            directory : path.resolve(__dirname, 'dist', 'MyApp'),
        },
    },
};