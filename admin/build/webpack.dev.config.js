const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const merge = require('webpack-merge');
const webpackBaseConfig = require('./webpack.base.config.js');
const fs = require('fs');
const packageJson = require('../package.json');

fs.open('./build/env.js', 'w', function (err, fd) {
  if (err) {
    return;
  }
  const buf = 'export default "development";';
  fs.write(fd, buf, 0, buf.length, 0, function (err, written, buffer) {
    if (err) {
      return false;
    }
  });
});

module.exports = merge(webpackBaseConfig, {
  devtool: '#source-map',
  output: {
    publicPath: '/',
    filename: '[name].js',
    chunkFilename: '[name].chunk.js'
  },
  plugins: [
    new ExtractTextPlugin({
      filename: '[name].css',
      allChunks: true
    }),
    new webpack.optimize.CommonsChunkPlugin({
      name: ['vender-exten', 'vender-base'],
      minChunks: Infinity
    }),
    new HtmlWebpackPlugin({
      title: 'mBook admin v' + packageJson.version,
      filename: '../index.html',
      inject: false
    }),
    new CopyWebpackPlugin([{
      from: 'src/views/main-components/theme-switch/theme'
    },
    {
      from: 'src/views/my-components/text-editor/tinymce'
    }
    ],
    {
      ignore: [
        'text-editor.vue'
      ]
    })
  ]
});
