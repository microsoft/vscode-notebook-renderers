// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const common = require('./common');
const FixDefaultImportPlugin = require('webpack-fix-default-import-plugin');
const path = require('path');
const constants = require('../constants');
const configFileName = 'src/client/tsconfig.json';
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
// Any build on the CI is considered production mode.
const isProdBuild = constants.isCI || process.argv.some((argv) => argv.includes('mode') && argv.includes('production'));

module.exports = {
    context: constants.ExtensionRootDir,
    entry: {
        renderers: './src/client/index.tsx'
    },
    output: {
        path: path.join(constants.ExtensionRootDir, 'out', 'client'),
        filename: '[name].js',
        chunkFilename: `[name].bundle.js`
    },
    mode: isProdBuild ? 'production' : 'development',
    devtool: isProdBuild ? 'source-map' : 'inline-source-map',
    node: {
        fs: 'empty'
    },
    plugins: [
        new FixDefaultImportPlugin(),
        new ForkTsCheckerWebpackPlugin({
            checkSyntacticErrors: true,
            tsconfig: configFileName,
            reportFiles: ['src/client/**/*.{ts,tsx}'],
            memoryLimit: 9096
        }),
        ...common.getDefaultPlugins('extension')
    ],
    stats: {
        performance: false
    },
    performance: {
        hints: false
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.json', '.svg']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
                    { loader: 'cache-loader' },
                    {
                        loader: 'thread-loader',
                        options: {
                            // there should be 1 cpu for the fork-ts-checker-webpack-plugin
                            workers: require('os').cpus().length - 1,
                            workerNodeArgs: ['--max-old-space-size=9096'],
                            poolTimeout: isProdBuild ? 1000 : Infinity // set this to Infinity in watch mode - see https://github.com/webpack-contrib/thread-loader
                        }
                    },
                    {
                        loader: 'ts-loader',
                        options: {
                            happyPackMode: true, // IMPORTANT! use happyPackMode mode to speed-up compilation and reduce errors reported to webpack
                            configFile: configFileName,
                            // Faster (turn on only on CI, for dev we don't need this).
                            transpileOnly: true,
                            reportFiles: ['src/client/**/*.{ts,tsx}']
                        }
                    }
                ]
            },
            {
                test: /\.svg$/,
                use: ['svg-inline-loader']
            },
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.js$/,
                include: /node_modules.*remark.*default.*js/,
                use: [
                    {
                        loader: path.resolve('./build/webpack/loaders/remarkLoader.js'),
                        options: {}
                    }
                ]
            },
            {
                test: /\.json$/,
                type: 'javascript/auto',
                include: /node_modules.*remark.*/,
                use: [
                    {
                        loader: path.resolve('./build/webpack/loaders/jsonloader.js'),
                        options: {}
                    }
                ]
            },
            {
                test: /\.(png|woff|woff2|eot|gif|ttf)$/,
                use: [
                    {
                        loader: 'url-loader?limit=100000',
                        options: { esModule: false }
                    }
                ]
            },
            {
                test: /\.less$/,
                use: ['style-loader', 'css-loader', 'less-loader']
            }
        ]
    }
};
