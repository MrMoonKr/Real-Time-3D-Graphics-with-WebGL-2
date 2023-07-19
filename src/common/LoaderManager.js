

/**
 * @callback onStartHandler 로딩 시작 콜백함수
 * @param {string} url
 * @param {number} itemloaded
 * @param {number} itemTotal
 */

/**
 * @callback onLoadHandler 로딩 완료 콜백함수
 * @param {string} url
 * @param {number} itemloaded
 * @param {number} itemTotal
 */

/**
 * @callback onProgressHandler 로딩 진행 콜백함수
 * @param {string} url
 * @param {number} itemloaded
 * @param {number} itemTotal
 */

/**
 * @callback onErrorHandler 로딩 에러 콜백함수
 * @param {string} url
 * @param {number} itemloaded
 * @param {number} itemTotal
 */

class LoaderManager 
{


    /**
     * 
     * @param {onLoadHandler} onLoad 
     * @param {onProgressHandler} onProgress 
     * @param {onErrorHandler} onError 
     */
    constructor( onLoad, onProgress, onError ) 
    {


        /**
         * @type {onStartHandler}
         */
        this.onStart = undefined ;
        /**
         * @type {onLoadHandler}
         */
        this.onLoad = onLoad ;
        /**
         * @type {onProgressHandler}
         */
        this.onProgress = onProgress ;
        /**
         * @type {onErrorHandler}
         */
        this.onError = onError ;

        this._isLoading = false ;
        this._itemsLoaded = 0 ;
        this._itemsTotal = 0 ;

    }

    itemStart( url )
    {
        this._itemsTotal++ ;

        if ( this._isLoading === false ) 
        {
            if ( this.onStart !== undefined )
            {
                this.onStart( url, this._itemsLoaded, this._itemsTotal ) ;
            }
        }

        this._isLoading = true ;
    }

    itemEnd( url )
    {
        this._itemsLoaded++ ;

        if ( this.onProgress != undefined )
        {
            this.onProgress( url, this._itemsLoaded, this._itemsTotal ) ;
        }

        if ( this._itemsLoaded === this._itemsTotal )
        {
            this._isLoading = false ;
            if ( this.onLoad !== undefined )
            {
                this.onLoad() ;
            }
        }
    }

    itemError( url )
    {
        if ( this.onError !== undefined )
        {
            this.onError( url );
        }
    }

    resolveURL( url )
    {
        return url ;
    }


}

const DefaultLoaderManager = new LoaderManager() ;

export { DefaultLoaderManager } ;

export default LoaderManager ;
