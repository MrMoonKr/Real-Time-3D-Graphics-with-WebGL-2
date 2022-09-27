//import path from 'path';
const path = require( 'path' );

module.exports = {

    mode: 'development',

    entry: {
        ch01_00_hello: './src/ch01_00_hello.js'
    },

    output: {
        path: __dirname + '/dist',
        filename: '[name].bundle.js'
    },

    devtool: 'source-map'
}