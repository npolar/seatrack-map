"use strict";

const webpack = require('webpack');
const merge = require('webpack-merge');
const parts = require('./libs/parts');

const common = {
    context: __dirname,
    entry: {
        app: './app/js/'
    },
    output: {
        path: __dirname + '/build',
        filename: '[name].js'
    },
    module: {
        unknownContextCritical: false,
        loaders: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                loader: 'babel',
                query: {
                    cacheDirectory: true,
                    presets: ['es2015']
                }
            },
            {
                test: /\.css$/,
                loaders: ['style', 'css']
            },
            {
                test: /\.scss$/,
                loaders: ['style', 'css', 'sass']
            },
            {
                test: /\.(png|gif|jpg|jpeg)$/,
                loader: 'file-loader'
            }, {
                test: require.resolve('./node_modules/material-design-lite/material'),
                loader: 'exports?componentHandler'
            }
        ]
    }
};

let config;

// Detect how npm is run and branch based on that
switch(process.env.npm_lifecycle_event) {
    case 'build':
        config = merge(common, {
            plugins: [
                new webpack.optimize.DedupePlugin(),
                new webpack.optimize.OccurenceOrderPlugin(),
                new webpack.optimize.UglifyJsPlugin({
                    debug: true,
                    minimize: true,
                    sourceMap: false,
                    output: {
                        comments: false
                    },
                    compressor: {
                        warnings: false
                    }
                })
            ]
        });
        break;
    default:
        config = merge(
            common,
            parts.devServer({
                // Customize host/port here if needed
                host: process.env.HOST,
                //port: process.env.PORT
                port: 8081
            })
        );
}

module.exports = config;