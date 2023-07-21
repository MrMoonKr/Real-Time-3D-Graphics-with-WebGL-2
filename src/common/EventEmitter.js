'use strict';

/**
 * @callback EventHandler
 * @param {string} event
 * @returns {void}
 */

// Simple implementation of the pub/sub pattern to decouple components
/**
 * 임의의 이벤트 및 핸들러를 등록한 후 emit() 시 콜백되게 하는 클래스.
 */
class EventEmitter
{

    constructor()
    {
        /**
         * @type { Object.<string, EventHandler[]> } 이벤트 핸들러 룩업 테이블
         */
        this.eventListeners = {};
    }

    /**
     * 
     * @param {string} event 이벤트 종류를 나타내는 문자열
     * @param {*} callback 이벤트 발생시 콜백되는 함수
     */
    on( event, callback )
    {
        const listeners = this.eventListeners ;

        if ( listeners[ event ] === undefined ) // 이벤트 등록
        {
            listeners[ event ] = [] ;
        }

        if ( listeners[ event ].indexOf( callback ) === -1 ) // 중복 등록 방지
        {
            listeners[ event ].push( callback ) ;
        }
    }

    remove( event, listener )
    {
        let listeners = this.eventListeners ;
        let callbacks = listeners[ event ] ;

        if ( callbacks !== undefined )
        {
            let index = callbacks.indexOf( listener ) ;
            if ( index !== -1 )
            {
                callbacks.splice( index, 1 ) ;
            }
        }
    }

    /**
     * 
     * @param {string} event 특정 이벤트
     */
    emit( event )
    {
        let listeners = this.eventListeners ;
        let callbacks = listeners[ event ] ;
        
        if ( callbacks !== undefined )
        {
            const array = callbacks.splice( 0 ) ; // 루프 실행 중 삭제 가능성으로 복사하여 사용함

            for ( let i=0 , l=array.length ; i < l ; ++i )
            {
                array[ i ].call( this, event ) ;
            }
        }
    }

}

export default EventEmitter;