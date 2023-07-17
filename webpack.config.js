//import path from 'path';
const path = require( 'path' ) ;
const fs = require( 'fs' ).promises ;

const { webpack, SourceMapDevToolPlugin } = require( 'webpack' );
const HtmlWebpackPlugin = require( 'html-webpack-plugin' );

const CHAPTER_PREFIX = path.join( __dirname, 'src/' ) ;

/**
 * 특정 디렉토리내에서 entry 객체 구성
 */
const getDirectoryEntries = async () => {

    const generatedPlugins = [] ;
    const generatedEntries = {} ;

    const chapters = [
        'ch01',
        'ch02',
        // 'ch03',
        // 'ch04',
        // 'ch05',
        // 'ch06',
        // 'ch07',
        // 'ch08',
        // 'ch09',
        // 'ch10',
    ]

    for ( const chapter of chapters )
    {
        const entries = await fs.readdir( CHAPTER_PREFIX + chapter, {
            withFileTypes: true,
            recursive: false
        } ) ;

        const candidates = entries.filter( ( entry ) => {
            return entry.name.endsWith( '.js' ) ;
        } ) ;

        for ( const candiate of candidates ) {
            const name = path.parse( candiate.name ).name ;
            const plugin = new HtmlWebpackPlugin( {
                filename: chapter + '/' + name + '.html' ,
                chunks: [name] ,
                template: './src/template.html'
            } ) ;

            generatedEntries[ name ] = {
                import: CHAPTER_PREFIX + chapter + '/' + candiate.name 
            }
    
            generatedPlugins.push( plugin ) ;

        }


        // const rootDir = path.resolve( __dirname + '/src/' ) ;
        // console.log( rootDir ) ;

        // fs.readdir( rootDir + '/' + chapter, 
        //     { withFileTypes: true },
        //     ( err, files ) => {

        //         //console.log( '검색된 파일들 : ' + files.length ) ;

        //         const candidates = files.filter( ( entry ) => {

        //             //console.log( '전달된 파일 : ' + entry.name ) ;
        //             return entry.name.endsWith( '.js' ) ;
        //         } ) ;

        //         //console.log( '검색된 파일들 : ' + candidates.length ) ;

        //         for ( const candidate of candidates ) {

        //             console.log( '선택 파일 : ' + candidate.name ) ;

        //             const name = path.parse( candidate.name ).name ;
        //             console.log( '출력 파일 : ' + chapter + '/' + name + '.html' ) ;
        //             console.log( '청크 파일 : ' + [name] ) ;

        //             const plugin = new HtmlWebpackPlugin( {
        //                 filename: chapter + '/' + name + '.html',
        //                 //chunks: [name],
        //                 template: './src/template.html'
        //             } ) ;

        //             //console.log( plugin ) ;

        //             console.log( '임포트 : ' + './src' + '/' + chapter + '/' + candidate.name ) ;

        //             generatedEntries[ name ] = {
        //                 import: './src' + '/' + chapter + '/' + candidate.name
        //             }

        //             //generatedPlugins.push( plugin ) ;
        //         }
        //     } 
        // ) ;
    }

    return { generatedEntries, generatedPlugins }

}

// getDirectoryEntries() ;

// console.log( '생성된 플러그인 : ' + generatedPlugins.length );
// console.log( generatedPlugins ) ;

// console.log( '생성된 엔트리 : ' );
// console.log( JSON.stringify( generatedEntries, null, 4 ) ) ;


module.exports = async () => {
    
    const { generatedEntries, generatedPlugins } = await getDirectoryEntries() ;

    // console.log( '생성된 플러그인 : ' + generatedPlugins.length );
    // console.log( generatedPlugins ) ;

    // console.log( '생성된 엔트리 : ' );
    // console.log( JSON.stringify( generatedEntries, null, 4 ) ) ;

    return {

        mode: 'development',

        entry: {
            //ch01_00_hello:                      './src/ch01_00_hello.js',

            ...generatedEntries,

            // ch01_00_javascript:                 './src/ch01/ch01_00_javascript.js',
            // ch01_00_typescript:                 './src/ch01/ch01_00_typescript.ts',
            // ch01_02_context:                    './src/ch01/ch01_02_context.ts',
            // ch01_05_attributes:                 './src/ch01/ch01_05_attributes.js',
            // //ch01_05_attributes:                 './src/ch01/ch01_05_attributes.ts',

            // ch02_00_hello:                      './src/ch02/ch02_00_hello.ts',
            // ch02_01_square:                     './src/ch02/ch02_01_square.js',
            // ch02_02_square_arrays:              './src/ch02/ch02_02_square_arrays.js',
            // ch02_03_square_vao:                 './src/ch02/ch02_03_square_vao.js',
            // //ch02_03_square_vao:                 './src/ch02/ch02_03_square_vao.ts',
            // ch02_04_rendering_modes:            './src/ch02/ch02_04_rendering_modes.js',
            
            // ch02_09_ajax_car_final:             './src/ch02/ch02_09_ajax_car_final.js',
            
            // ch03_00_hello:                      './src/ch03/ch03_00_hello.js',
            // ch03_01_goraud_lambert:             './src/ch03/ch03_01_goraud_lambert.js',
            // ch03_02_moving_light:               './src/ch03/ch03_02_moving_light.js',
            
            // ch03_07_positional_lighting:        './src/ch03/ch03_07_positional_lighting.js',


            //ch04_00_model_view_translation:     './src/ch04_00_model_view_translation.js',
            // ch04_00_model_view_translation:     './src/ch04/ch04_00_model_view_translation.js',
            // ch04_04_camera_type:                './src/ch04_04_camera_types.js',

            // ch07_01_textured_cube:              './src/ch07/ch07_01_textured_cube.js',
            // ch07_02_textured_cube_final:        './src/ch07/ch07_02_textured_cube_final.js',
            // ch07_06_multi_texture_final:        './src/ch07/ch07_06_multi_texture_final.js',
            
            // ch08_04_picking_final:              './src/ch08_04_picking_final.js'
        },

        output: {
            //path: __dirname + '/dist',
            path: __dirname + '/public',
            //filename: 'js/[name].bundle.js'
            filename: function ( pathData, assetInfo )
            {
                // console.log( pathData ); // https://webpack.js.org/configuration/output/#outputfilename
                // console.log( assetInfo );  // all just {}
                const parent   = pathData.chunk.name.substr( 0,  4 ) ;
                const name     = pathData.chunk.name ;
                const ext      = '.bundle.js';
                const fileName = path.join( 'js', parent, name + ext );
                console.log( '출력파일 : ' + fileName );
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
            } ) ,

            ...generatedPlugins ,

            /*new HtmlWebpackPlugin( {
                //title: '[file]',
                filename: ( entryName ) => {
                    return entryName + '.html';
                } ,
                template: './src/template.html'
            } )*/
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
                },
                {
                    test: /\.(glsl|vert|frag|vs|fs)$/,
                    exclude: /node_modules/,
                    loader: 'webpack-glsl-loader'
                }
            ]
        },

        resolve: {
            extensions: [ '.js', '.ts' ]
        }

        //watch: true
    }
}


