//import path from 'path';
const path = require( 'path' );

module.exports = {

    mode: 'development',

    entry: {
        ch01_00_hello: './src/ch01_00_hello.js',
        ch02_00_hello: './src/ch02_00_hello.js',
        ch04_00_model_view_translation: './src/ch04_00_model_view_translation.js',
    },

    output: {
        path: __dirname + '/dist',
        filename: '[name].bundle.js'
    },

    devtool: 'source-map'
}