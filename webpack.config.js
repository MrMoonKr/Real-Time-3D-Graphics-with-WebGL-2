const path  = require( 'path' ) ;
const fs    = require( 'fs' ).promises ;

const { SourceMapDevToolPlugin } = require( 'webpack' ) ;
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' ) ;
const HtmlWebpackPlugin = require( 'html-webpack-plugin' ) ;
const CopyPlugin = require( 'copy-webpack-plugin' ) ;


const CHAPTER_PARENT = path.join( __dirname, 'src' ) ;
const CHAPTER_LIST = [
    'ch01' ,
    'ch02' ,
    'ch03' ,
    'ch04' ,
    //'ch05' ,
    //'ch06' ,
    //'ch07' ,
    //'ch08' ,
    //'ch09' ,
    //'ch10' ,
] ;
const TEMPLATE_HTML = './src/template.html' ;


module.exports = async () => {
    
    const { generatedEntries, generatedPlugins } = 
        await getDirectoryEntries( CHAPTER_PARENT, CHAPTER_LIST, TEMPLATE_HTML ) ;

    return {

        mode: 'development',

        entry: {
            // https://webpack.js.org/configuration/entry-context/#entry

            ch01_00_hello: './src/ch01_00_hello.js',
            ch02_00_hello: './src/ch02_00_hello.js',

            ...generatedEntries,

        },

        output: {
            path: __dirname + '/dist',
            //path: __dirname + '/public',
            
            //filename: 'js/[name].[contenthash:8].js'
            filename: function ( pathData, assetInfo )
            {
                // console.log( pathData ); // https://webpack.js.org/configuration/output/#outputfilename
                // console.log( assetInfo );  // all just {}

                // console.log( 'pathData : ' );
                // console.log( pathData ) ;
                // console.log( 'assetInfo : ' );
                // console.log( assetInfo ) ;

                const parent   = pathData.chunk.name.substr( 0,  4 ) ;
                const name     = pathData.chunk.name ;
                const ext      = '.bundle.js';
                const fileName = path.join( 'js', parent, name + ext ) ;
                console.log( '출력파일 : ' + fileName ) ;
                return fileName ;
            } 
        },

        devtool: 'source-map',
        //devtool: 'inline-cheap-module-source-map',

        plugins: [
            // https://webpack.js.org/plugins/source-map-dev-tool-plugin
            // new SourceMapDevToolPlugin( {
            //     filename:'[file].map',
            //     //append: '\n//# sourceMappingURL=[file].map'
            //     append: '\n//# sourceMappingURL=[name].bundle.js.map'
            // } ) ,

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
                    test: /\.js$/,
                    exclude: /node_modules/,
                    use: {
                        loader: 'babel-loader',
                        options: {
                            presets: [ '@babel/preset-env', '@babel/preset-react' ]
                        }
                    }
                },
                {
                    test: /\.(glsl|vert|frag|vs|fs)$/,
                    exclude: /node_modules/,
                    loader: 'webpack-glsl-loader'
                },
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
        },

        devServer: {

            hot: true,

            port: 5507,

            //contentBase: path.join( __dirname, 'dist' ), <- deprecated to static
            static: {
                directory: path.join( __dirname, 'dist' )
            }
        }
    }
}


/**
 * 챕터 목록으로 부터 webpack용 entry 객체 및 html plugin 목록 생성
 * @param {string} parentPath 상위 부모 디렉토리명 ex) path.join( __dirname, 'src' )
 * @param {Array<string>} chapters 챕터 디렉토리명 목록 ex) [ 'ch01', 'ch02', 'ch03', ] 
 * @param {string} template 템플릿 html 페이지 경로 ex) './src/template.html'
 */
const getDirectoryEntries = async ( parentPath, chapters, template='./src/template.html' ) => {

    const generatedPlugins = [] ;
    const generatedEntries = {} ;

    for ( const chapter of chapters ) {
        
        // 하부디렉토리 및 파일 모두 받는다
        const entries = await fs.readdir( path.join( parentPath, chapter ), {
            withFileTypes: true,
            recursive: false
        } ) ;

        // js 파일만 추린다
        const candidates = entries.filter( ( entry ) => {
            return entry.name.endsWith( '.js' ) ;
        } ) ;

        // js 이름과 같은 html 문서를 생성하고 같은 이름의 chunk를 임베딩
        for ( const candiate of candidates ) {

            const name = path.parse( candiate.name ).name ;

            // entry 객체 구성

            generatedEntries[ name ] = {
                import: path.join( parentPath, chapter, candiate.name )
            }

            // html plugin 객체 구성

            const plugin = new HtmlWebpackPlugin( {
                filename: path.join( chapter, name + '.html' ),
                chunks: [name] ,
                template: template
            } ) ;
            
            generatedPlugins.push( plugin ) ;

        }
    }

    return { generatedEntries, generatedPlugins }
}
