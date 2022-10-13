//import path from 'path';
const path = require( 'path' );

module.exports = {

    mode: 'development',

    entry: {
        ch01_00_hello: './src/ch01_00_hello.js',
        ch02_00_hello: './src/ch02_00_hello.js',
        ch04_00_model_view_translation: './src/ch04_00_model_view_translation.js',
        ch04_04_camera_type: './src/ch04_04_camera_types.js',
        ch08_04_picking_final: './src/ch08_04_picking_final.js'
    },

    output: {
        path: __dirname + '/dist',
        //filename: '[name].bundle.js'
        filename: function ( pathData, assetInfo )
        {
            // console.log( pathData ); // https://webpack.js.org/configuration/output/#outputfilename
            // console.log( assetInfo );  // all just {}
            const parent   = pathData.chunk.name.substr(0,4);
            const name     = pathData.chunk.name;
            const ext      = '.bundle.js';
            const fileName = path.join( parent, name + ext );
            // console.log( fileName );
            return fileName;
        } 
    },

    devtool: 'source-map',
    //watch: true
}