// 클래스 형태로 변경


import utils from '../common/Utils.js' ;


class App 
{

    constructor()
    {
        /**
         * 
         * @type {HTMLCanvasElement}
         */
        this.canvas = document.getElementById( 'webgl-canvas' ) ;
        /**
         * 
         * @type {WebGL2RenderingContext}
         */
        this.gl     = utils.getGLContext( this.canvas ) ;

        this.updateClearColor = function ( ...color )
        {
            if ( this.gl )
            {
                this.gl.clearColor( ...color ) ;
                this.gl.clear( this.gl.COLOR_BUFFER_BIT ) ;
                this.gl.viewport( 0, 0, 0, 0 ) ;
            }
        }

        window.addEventListener( 'keydown', ( e ) => { 
            switch ( e.key )
            {
                case '1':
                    {
                        this.updateClearColor( 0.8, 0.2, 0.2, 1.0 ) ;
                    }
                    break;
                case '2':
                    {
                        this.updateClearColor( 0.2, 0.8, 0.2, 1.0 ) ;
                    }
                    break;
                case '3':
                    {
                        this.updateClearColor( 0.2, 0.2, 0.8, 1.0 ) ;
                    }
                    break;
                case '4':
                    {
                        this.updateClearColor( Math.random(), Math.random(), Math.random(), 1.0 ) ;
                    }
                    break;
                case '5':
                    {
                        const color = this.gl.getParameter( this.gl.COLOR_CLEAR_VALUE ) ;
                        alert( `clearColor = (  ${color[0].toFixed(1)} , ${color[1].toFixed(1)} , ${color[2].toFixed(1)} , ${color[3].toFixed(1)} )`) ;
                        
                        window.focus();
                    }
                    break;
                default:
                    {
                        console.log( `[i] Key : ${e.key}` );
                    }
            }
        } ) ;
    }
}

/**
 * 메인 진입점 함수
 */
function init()
{
    // 앱 생성
    const app = new App() ;
}

document.addEventListener( 'DOMContentLoaded', init ) ; 

