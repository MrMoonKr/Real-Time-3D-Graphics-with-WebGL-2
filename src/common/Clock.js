'use strict';

import EventEmitter from "./EventEmitter.js";


/**
 * 단위는 밀리초이다.
 * Returns the number of milliseconds elapsed since midnight, January 1, 1970 Universal Coordinated Time (UTC).
 * @returns 
 */
function now() 
{
    return ( typeof performance === 'undefined' ? Date : performance ).now() ;
}

// Abstracts away the requestAnimationFrame in an effort to provie a clock instance
// to sync various parts of an application
class Clock extends EventEmitter
{

    constructor( autoStart = true )
    {
        super();

        this.autoStart = autoStart;

        this.startTime = 0 ;
        this.oldTime = 0 ;
        this.elapsedTime = 0 ;

        this.isRunning = false ;

        this.tick = this.tick.bind( this );
        this.tick();

        window.onblur = () => {
            this.stop();
            console.info( 'Clock stopped' );
        };

        window.onfocus = () => {
            this.start();
            console.info( 'Clock resumed' );
        };
    }

    /**
     * 함수 호출간격을 흐른 시간으로 반환
     * @returns 초
     */
    getDelta()
    {
        let diff = 0 ;

        if ( this.autoStart && this.isRunning === false )
        {
            this.start() ;
            return 0 ;
        }

        if ( this.isRunning )
        {
            const currentTime = now() ;
            diff = ( currentTime - this.oldTime ) / 1000 ; // 초단위로
            this.oldTime = currentTime ;

            this.elapsedTime += diff ;
        }

        return diff ;
    }

    getElapsedTime()
    {
        this.getDelta() ;
        return this.elapsedTime ;
    }

    // Gets called on every requestAnimationFrame cycle
    tick()
    {
        if ( this.isRunning )
        {
            this.emit( 'tick' );
        }

        requestAnimationFrame( this.tick );
    }

    // Starts the clock
    start()
    {
        this.startTime      = now() ;
        this.oldTime        = this.startTime ;
        this.elapsedTime    = 0 ;

        this.isRunning      = true;
    }

    // Stops the clock
    stop()
    {
        this.isRunning = false ;

        this.getElapsedTime() ;
        this.autoStart = false ;
    }

}

export default Clock ;
