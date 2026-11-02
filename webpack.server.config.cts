const path = require('path');
const fs = require('fs');
const webpack = require('webpack');
const dotenv = require('dotenv');
const TerserPlugin = require('terser-webpack-plugin');
const nodeExternals = require('webpack-node-externals');

dotenv.config();

const SERVER_DIR = path.resolve(__dirname, 'server');

const collectEntries = (dir: string): Record<string, string> => {
    const entries: Record<string, string> = {};
    const walk = (current: string): void => {
        for (const dirent of fs.readdirSync(current, { withFileTypes: true })) {
            const fullPath = path.join(current, dirent.name);
            if (dirent.isDirectory()) {
                walk(fullPath);
                continue;
            }
            if (!dirent.name.endsWith('.ts') || dirent.name.endsWith('.d.ts')) {
                continue;
            }
            const name = path
                .relative(SERVER_DIR, fullPath)
                .replace(/\\/g, '/')
                .replace(/\.ts$/, '');
            entries[name] = fullPath;
        }
    };
    walk(dir);
    return entries;
};

module.exports = {
    mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',
    target: 'node',
    entry: collectEntries(SERVER_DIR),
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist', 'server'),
        clean: true,
        library: { type: 'commonjs2' },
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            '@server': SERVER_DIR,
        },
    },
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
                            },
                        },
                    },
                },
            },
        ],
    },
    externalsPresets: {
        node: true
    },
    externals: [
        nodeExternals(),
        ({ request }: { request?: string }, callback: (err?: Error | null, result?: string) => void) => {
            if (request && request.startsWith('.')) {
                return callback(null, 'commonjs ' + request);
            }
            if (request && /\.node$/.test(request)) {
                return callback(null, 'commonjs ' + request);
            }
            callback();
        },
    ],
    plugins: [
        new webpack.DefinePlugin({'process.env.ELECTRON': JSON.stringify('true')}),
    ],
    stats: {
        warningsFilter: [/Critical dependency: the request of a dependency is an expression/],
        errorDetails: true,
        children: true,
    },
    optimization: {
        minimize: true,
        splitChunks: false,
        runtimeChunk: false,
        minimizer: [
            new TerserPlugin({
                minify: TerserPlugin.swcMinify,
                extractComments: false,
                terserOptions: {
                    ecma: 2020,
                    mangle: true,
                },
            }),
        ],
    },
}

