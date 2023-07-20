
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

    setPath( path )
    {
        this.path = path;
        return this;
    }

    setCrossOrigin( crossOrigin )
    {
        this.crossOrigin = crossOrigin;
        return this;
    }

    setWithCredentials( value )
    {
        this.withCredentials = value;
        return this;
    }

    setResourcePath( resourcePath )
    {
        this.resourcePath = resourcePath;
        return this;
    }

    setRequestHeader( requestHeader )
    {
        this.requestHeader = requestHeader;
        return this;
    }

}


export default Loader ;
