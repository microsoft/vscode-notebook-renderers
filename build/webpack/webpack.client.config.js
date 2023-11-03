// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

const common = require('./common');
const path = require('path');
const constants = require('../constants');
const configFileName = 'src/client/tsconfig.json';
const { DefinePlugin } = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const PostBuildHookWebpackPlugin = require('./postBuildHook.js');
// Any build on the CI is considered production mode.
const isProdBuild = constants.isCI || process.argv.some((argv) => argv.includes('mode') && argv.includes('production'));
const filesToCopy = [
    {
        from: path.join(
            constants.ExtensionRootDir,
            'node_modules',
            '@vscode',
            'jupyter-ipywidgets7',
            'dist',
            'ipywidgets.js'
        ),
        to: path.join(
            constants.ExtensionRootDir,
            'out',
            'node_modules',
            '@vscode',
            'jupyter-ipywidgets7',
            'dist',
            'ipywidgets.js'
        )
    },
    {
        from: path.join(
            constants.ExtensionRootDir,
            'node_modules',
            '@vscode',
            'jupyter-ipywidgets8',
            'dist',
            'ipywidgets.js'
        ),
        to: path.join(
            constants.ExtensionRootDir,
            'out',
            'node_modules',
            '@vscode',
            'jupyter-ipywidgets8',
            'dist',
            'ipywidgets.js'
        )
    }
];

const defaultConfig = {
    context: constants.ExtensionRootDir,
    entry: {
        renderers: './src/client/index.tsx',
        markdown: './src/client/markdown.ts',
        builtinRendererHooks: './src/client/builtinRendererHooks.ts',
        vegaRenderer: './src/client/vegaRenderer.ts'
    },
    output: {
        path: path.join(constants.ExtensionRootDir, 'out', 'client_renderer'),
        filename: '[name].js',
        chunkFilename: `[name].bundle.js`,
        libraryTarget: 'module'
    },
    experiments: {
        outputModule: true
    },
    mode: isProdBuild ? 'production' : 'development',
    devtool: isProdBuild ? 'source-map' : 'inline-source-map',
    externals: ['vscode', 'commonjs'],
    plugins: [
        new ForkTsCheckerWebpackPlugin({
            checkSyntacticErrors: true,
            tsconfig: configFileName,
            reportFiles: ['src/client/**/*.{ts,tsx}'],
            memoryLimit: 9096
        }),
        new DefinePlugin({
            scriptUrl: 'import.meta.url',
            'process.env': '{}' // utils references `process.env.xxx`
        }),
        new CopyWebpackPlugin({
            patterns: [...filesToCopy]
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
        fallback: {
            fs: false,
            path: require.resolve('path-browserify'),
            'ansi-to-react': path.join(__dirname, 'ansi-to-react.js'),
            util: require.resolve('util') // vega uses `util.promisify` (we need something that works outside node)
        },
        extensions: ['.ts', '.tsx', '.js', '.json', '.svg']
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: [
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
            },
            {
                test: /\.node$/,
                use: [
                    {
                        loader: 'node-loader'
                    }
                ]
            }
        ]
    }
};
const preloadConfig = {
    context: constants.ExtensionRootDir,
    entry: {
        preload: './src/client/preload.ts'
    },
    output: {
        path: path.join(constants.ExtensionRootDir, 'out', 'client_renderer'),
        filename: '[name].js',
        chunkFilename: `[name].bundle.js`,
        libraryTarget: 'module'
    },
    experiments: {
        outputModule: true
    },
    mode: isProdBuild ? 'production' : 'development',
    devtool: isProdBuild ? 'source-map' : 'inline-source-map',
    plugins: [
        new ForkTsCheckerWebpackPlugin({
            checkSyntacticErrors: true,
            tsconfig: configFileName,
            reportFiles: ['src/client/**/*.{ts,tsx}'],
            memoryLimit: 9096
        }),
        new DefinePlugin({
            scriptUrl: 'import.meta.url',
            'process.env': '{}' // utils references `process.env.xxx`
        }),
        ...common.getDefaultPlugins('extension'),
        new PostBuildHookWebpackPlugin()
    ],
    stats: {
        performance: false
    },
    performance: {
        hints: false
    },
    resolve: {
        fallback: {
            fs: false,
            path: require.resolve('path-browserify'),
            util: require.resolve('util') // vega uses `util.promisify` (we need something that works outside node)
        },
        extensions: ['.ts', '.js']
    }
};
module.exports = [defaultConfig, preloadConfig];
