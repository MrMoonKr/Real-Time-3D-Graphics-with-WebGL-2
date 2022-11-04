
function init()
{
    const canvas = document.getElementById( 'webgl-canvas' ) as HTMLCanvasElement ;

    if ( !canvas )
    {
        console.error( 'No HTML5 Canvas was found' ) ;
        return ;
    }

    const gl = canvas.getContext( 'webgl2' );

    const message = gl ?
        'Got WegGL2 rendering context' :
        'WebGL2 is not available' ;

    alert( message ) ;
}

document.addEventListener( 'DOMContentLoaded', init ) ; 

export {}