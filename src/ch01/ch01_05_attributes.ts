// @ts-nocheck

import utils from '../common/Utils.js' ;

let gl: WebGL2RenderingContext ;

function updateClearColor( ...color: number[] ): void
{
    if ( gl )
    {
        gl.clearColor( ...color ) ;
        gl.clear( gl.COLOR_BUFFER_BIT ) ;
        gl.viewport( 0, 0, 0, 0 ) ;
    }
}

function checkKey( e: KeyboardEvent ): void
{
    switch ( e.key )
    {
        case '1':
            {
                updateClearColor( 0.8, 0.2, 0.2, 1.0 ) ;
            }
            break;
        case '2':
            {
                updateClearColor( 0.2, 0.8, 0.2, 1.0 ) ;
            }
            break;
        case '3':
            {
                updateClearColor( 0.2, 0.2, 0.8, 1.0 ) ;
            }
            break;
        case '4':
            {
                updateClearColor( Math.random(), Math.random(), Math.random(), 1.0 ) ;
            }
            break;
        case '5':
            {
                const color = gl.getParameter( gl.COLOR_CLEAR_VALUE ) ;
                alert( `clearColor = (  ${color[0].toFixed(1)} , ${color[1].toFixed(1)} , ${color[2].toFixed(1)} , ${color[3].toFixed(1)} )`) ;
                
                window.focus();
            }
            break;
        default:
            {
                console.log( `[i] Key : ${e.key}` );
            }
    }
}


function init(): void
{
    const canvas = document.getElementById( 'webgl-canvas' ) as HTMLCanvasElement ;

    if ( !canvas )
    {
        console.error( 'No HTML5 Canvas was found' ) ;
        return ;
    }

    //gl = canvas.getContext( 'webgl2' );
    gl = utils.getGLContext( canvas ) ;

    window.addEventListener( 'keydown', checkKey );
}

document.addEventListener( 'DOMContentLoaded', init ) ; 

export {}