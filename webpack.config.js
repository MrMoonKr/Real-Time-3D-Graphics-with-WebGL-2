const path  = require( 'path' ) ;
const fs    = require( 'fs' ).promises ;

const { SourceMapDevToolPlugin } = require( 'webpack' ) ;
const HtmlWebpackPlugin = require( 'html-webpack-plugin' ) ;


const CHAPTER_PARENT = path.join( __dirname, 'src/' ) ;
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
                const fileName = path.join( 'js', parent, name + ext ) ;
                console.log( '출력파일 : ' + fileName ) ;
                return fileName ;
            } 
        },

        //devtool: 'source-map',
        devtool: 'inline-cheap-module-source-map',

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


/**
 * 챕터 목록으로 부터 webpack용 entry 객체 및 html plugin 목록 생성
 * @param {string} parentPath 상위 부모 디렉토리명
 * @param {Array<string>} chapters 챕터 디렉토리명 목록 ex) [ 'ch01', 'ch02', 'ch03', ] 
 * @param {string} template 템플릿 html 페이지 경로 ex) './src/template.html'
 */
const getDirectoryEntries = async ( parentPath, chapters, template='./src/template.html' ) => {

    const generatedPlugins = [] ;
    const generatedEntries = {} ;

    for ( const chapter of chapters )
    {
        const entries = await fs.readdir( parentPath + chapter, {
            withFileTypes: true,
            recursive: false
        } ) ;

        const candidates = entries.filter( ( entry ) => {
            return entry.name.endsWith( '.js' ) ;
        } ) ;

        for ( const candiate of candidates ) {

            const name   = path.parse( candiate.name ).name ;
            const plugin = new HtmlWebpackPlugin( {
                //filename: chapter + '/' + name + '.html' ,
                filename: path.join( chapter, name + '.html' ),
                chunks: [name] ,
                template: template
            } ) ;

            generatedEntries[ name ] = {
                //import: parentPath + chapter + '/' + candiate.name 
                import: path.join( parentPath, chapter, candiate.name )
            }

            generatedPlugins.push( plugin ) ;

        }
    }

    return { generatedEntries, generatedPlugins }
}

