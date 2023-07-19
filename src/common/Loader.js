
import LoaderManager from "./LoaderManager";
import { DefaultLoaderManager } from "./LoaderManager";

class Loader
{


    /**
     * 
     * @param {LoaderManager} manager 
     */
    constructor( manager )
    {
        

        this.manager = ( manager !== undefined ) ? manager : DefaultLoaderManager ;

        this.crossOrigin = 'anonymous' ;
        this.withCredentials = false ;
        this.path = '';
        this.resourcePath = '';
        this.requestHeader = {} ;

        this.mimeType = '' ;
        this.responseType = '' ;
    }

    load( url, onLoad, onProgress, onError )
    {
        //
    }

    parse( data )
    {
        //
    }

}


export default Loader ;
