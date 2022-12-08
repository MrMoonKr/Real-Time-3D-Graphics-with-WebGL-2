//import path from 'path';
const path = require( 'path' );
const { webpack, SourceMapDevToolPlugin } = require( 'webpack' );

module.exports = {

    mode: 'development',

    entry: {
        ch01_00_hello:                      './src/ch01_00_hello.js',
        ch01_00_typescript:                 './src/ch01/ch01_00_typescript.ts',
        ch01_02_context:                    './src/ch01/ch01_02_context.ts',
        ch01_05_attributes:                 './src/ch01/ch01_05_attributes.ts',

        ch02_00_hello:                      './src/ch02/ch02_00_hello.ts',
        ch02_01_square:                     './src/ch02/ch02_01_square.ts',
        ch02_03_square_vao:                 './src/ch02/ch02_03_square_vao.ts',
        
        ch03_00_hello:                      './src/ch03/ch03_00_hello.js',


        ch04_00_model_view_translation:     './src/ch04_00_model_view_translation.js',
        ch04_04_camera_type:                './src/ch04_04_camera_types.js',

        ch07_01_textured_cube:              './src/ch07/ch07_01_textured_cube.js',
        ch07_02_textured_cube_final:        './src/ch07/ch07_02_textured_cube_final.js',
        ch07_06_multi_texture_final:        './src/ch07/ch07_06_multi_texture_final.js',
        
        ch08_04_picking_final:              './src/ch08_04_picking_final.js'
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

    plugins: [
        // https://webpack.js.org/plugins/source-map-dev-tool-plugin
        new SourceMapDevToolPlugin( {
            filename:'[file].map',
            //append: '\n//# sourceMappingURL=[file].map'
            append: '\n//# sourceMappingURL=[name].bundle.js.map'
        } )
    ],

    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                loader: 'ts-loader',
                options: {
                    compilerOptions: {
                        module: 'esnext',
                        declaration: false
                    }
                }
            }
        ]
    },

    resolve: {
        extensions: [ '.js', '.ts' ]
    }

    //watch: true
}