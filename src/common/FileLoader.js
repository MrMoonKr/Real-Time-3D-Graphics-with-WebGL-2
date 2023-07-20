import Loader from "./Loader";
import LoaderManager from "./LoaderManager";
import Cache from "./Cache";


/**
 * @callback onLoadHander 로딩 완료 콜백함수
 * @param {object} data
 */
/**
 * @callback onProgressHander 로딩 진행 콜백함수
 * @param {ProgressEvent} event
 */
/**
 * @callback onErrorHander 로딩 에러 콜백함수
 * @param {Error} error
 */



/**
 * 로딩중인 항목 관리 테이블용 객체
 */
const loading = {}

/**
 * fetch()를 이용한 비동기 리소스 요청시 발생한 에러 처리용
 */
class HttpError extends Error 
{

    /**
     * 
     * @param {string} message 
     * @param {Response} response 
     */
    constructor( message, response )
    {
        super( message ) ;

        this.response = response ;
    }

}



class FileLoader extends Loader
{

    /**
     * 
     * @param {LoaderManager} manager 
     */
    constructor( manager )
    {
        super( manager ) ;
    }

    /**
     * 
     * @param {string} url 
     * @param {onLoadHander} onLoad 
     * @param {onProgressHander} onProgress 
     * @param {onErrorHander} onError 
     */
    load( url, onLoad, onProgress, onError )
    {
        if ( url === undefined ) url = '' ;
        if ( this.path !== undefined ) url = this.path + url ;

        url = this.manager.resolveURL( url ) ;

        const cached = Cache.get( url ) ;
        if ( cached !== undefined ) // 캐시에서 리턴
        {
            this.manager.itemStart( url ) ;

            // 바로 완료 콜백
            setTimeout( () => {
                if ( onLoad )
                {
                    onLoad( cached ) ;
                }
                this.manager.itemEnd( url ) ;
            }, 0 ) ;

            return cached ;
        }

        if ( loading[ url ] !== undefined )
        {
            loading[ url ].push( {
                onLoad: onLoad,
                onProgress: onProgress,
                onError: onError
            } ) ;

            return ;
        }

        loading[ url ] = [] ;
        loading[ url ].push( {
            onLoad: onLoad,
            onProgress: onProgress,
            onError: onError
        } ) ;

        const reqOption = {
            headers: new Headers( this.requestHeader ),
            credentials: this.withCredentials ? 'include' : 'same-origin' ,
        } ;
        const req = new Request( url, reqOption ) ;

        const mimeType = this.mimeType ;
        const responseType = this.responseType ;

        fetch( req )
            .then( response => {
                if ( response.status === 200 || response.status === 0 )
                {
                    if ( response.status === 0 )
                    {
                        console.warn( '[ FileLoader ] HTTP Status 0 received' ) ;
                    }

                    if ( typeof ReadableStream === 'undefined' || response.body === undefined || response.body.getReader === undefined )
                    {
                        return response ;
                    }

                    const callbacks     = loading[ url ] ;
                    const reader        = response.body.getReader() ;

                    // Nginx needs X-File-Size check
                    // https://serverfault.com/questions/482875/why-does-nginx-remove-content-length-header-for-chunked-content
                    const contentLength = response.headers.get( 'Content-Length' ) || response.headers.get( 'X-File-Size' ) ;
                    const total         = contentLength ? parseInt( contentLength ) : 0 ;
                    const lengthComputable = total !== 0 ;

                    let loaded = 0 ;

                    // periodically read data into the new stream tracking while download progress
                    const stream = new ReadableStream( {

                        start( controller ) {

                            readData();

                            function readData() {

                                reader.read().then( ( { done, value } ) => {

                                    if ( done ) 
                                    {
                                        controller.close() ;
                                    } 
                                    else 
                                    {
                                        loaded += value.byteLength ;

                                        const event = new ProgressEvent( 'progress', {
                                            lengthComputable,
                                            loaded,
                                            total
                                        } ) ;

                                        for ( let i = 0, il = callbacks.length ; i < il ; i++ )
                                        {
                                            const callback = callbacks[ i ] ;
                                            if ( callback.onProgress ) callback.onProgress( event ) ;
                                        }

                                        controller.enqueue( value ) ;

                                        readData();
                                    }

                                } );

                            }

                        }

                    } );

                    return new Response( stream );
                }
                else
                {
                    throw new HttpError( `[ FileLoader ] fetch for "${response.url}" responded with ${response.status}: ${response.statusText}`, response );
                }
            } )
            .then( response => {
                switch ( responseType )
                {
                    case 'arraybuffer':
                        {
                            return response.arrayBuffer() ;
                        }
                        break;

                    case 'blob':
                        {
                            return response.blob() ;
                        }
                        break;

                    case 'document':
                        {
                            return response.text().then( text => {
                                const parser = new DOMParser() ;
                                return parser.parseFromString( text, mimeType ) ;
                            })
                        }
                        break;

                    case 'json':
                        {
                            return response.json() ;
                        }
                        break;

                    default:
                        {
                            if ( mimeType === undefined ) // 기본은 텍스트로 반환
                            {
                                return response.text() ;
                            }
                            else
                            {
                                // sniff encoding
                                const re        = /charset="?([^;"\s]*)"?/i ;
                                const exec      = re.exec( mimeType ) ;
                                const label     = exec && exec[ 1 ] ? exec[ 1 ].toLowerCase() : undefined ;
                                const decoder   = new TextDecoder( label ) ;

                                return response.arrayBuffer().then( ab => decoder.decode( ab ) ) ;
                            }
                        }
                }
            } )
            .then( data => {
                
                // Cache.add( url, data ) ;

                const callbacks = loading[ url ] ;
                delete loading[ url ] ;

                for ( let i = 0, il = callbacks.length ; i < il ; i++ )
                {
                    const callback = callbacks[ i ];
                    if ( callback.onLoad ) callback.onLoad( data );
                }
            } )
            .catch( err => {

                const callbacks = loading[ url ] ;
                if ( callbacks === undefined )
                {
                    this.manager.itemError( url ) ;
                    throw err ;
                }

                delete loading[ url ] ;

                for ( let i = 0, il = callbacks.length ; i < il ; i++ )
                {
                    const callback = callbacks[ i ] ;
                    if ( callback.onError ) callback.onError( err ) ;
                }

                this.manager.itemError( url ) ;

            } )
            .finally( () => {

                this.manager.itemEnd( url ) ;

            } );

        this.manager.itemStart( url ) ;
    }

    setResponseType( value )
    {
        this.responseType = value ;
        return this ;
    }

    setMimeType( value )
    {
        this.mimeType = value ;
        return this ;
    }
}


export default FileLoader ;
