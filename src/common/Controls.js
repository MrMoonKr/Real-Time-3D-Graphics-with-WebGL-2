'use strict';

import Camera from "./Camera";
import Scene from "./Scene";

// Abstraction over common controls for user interaction with a 3D scene
class Controls 
{

    /**
     * 
     * @param {Camera} camera 
     * @param {HTMLCanvasElement} canvas 
     * @param {Scene} scene 
     */
    constructor( camera, canvas, scene ) 
    {

        this.scene = scene;

        this.camera = camera;
        this.canvas = canvas;

        this.picker = null;

        this.dragging = false;
        this.picking = false;
        this.ctrl = false;

        this.x = 0;
        this.y = 0;
        this.lastX = 0;
        this.lastY = 0;
        this.button = 0;
        this.key = 0;

        this.dloc = 0;
        this.dstep = 0;
        this.motionFactor = 10;
        this.keyIncrement = 5;

        canvas.onmousedown  = event => this.onMouseDown( event );
        canvas.onmouseup    = event => this.onMouseUp( event );
        canvas.onmousemove  = event => this.onMouseMove( event );
        window.onkeydown    = event => this.onKeyDown( event );
        window.onkeyup      = event => this.onKeyUp( event );

        canvas.ontouchstart = ( e ) => this.onTouch( e );
    }

    /**
     * 작성중...
     * @param { TouchEvent } e 
     */
    onTouch( e )
    {
        let touches     = e.changedTouches ;
        let first       = touches[0] ;
        let type        = e.type ;

    }

    // Sets picker for picking objects
    setPicker( picker ) {
        this.picker = picker;
    }

    // Returns 3D coordinates
    /**
     * 
     * @param {MouseEvent} event 
     * @returns 
     */
    get2DCoords( event ) 
    {
        let top = 0,
            left = 0,
            canvas = this.canvas;

        while ( canvas && canvas.tagName !== 'BODY' )
        {
            top     += canvas.offsetTop;
            left    += canvas.offsetLeft;
            canvas  = canvas.offsetParent;
        }

        left    += window.scrollX;
        top     -= window.scrollY;

        return {
            x: event.clientX - left,
            y: this.canvas.height - ( event.clientY - top )
        };
    }

    /**
     * canvas 에서의 마우스 업 이벤트 핸들러.
     * @param {MouseEvent} event 
     */
    onMouseUp( event ) 
    {
        this.dragging = false;

        if ( !event.shiftKey && this.picker )
        {
            this.picking = false;
            this.picker.stop();
        }
    }

    /**
     * canvas 에서의 마우스 다운 이벤트 핸들러.
     * @param {MouseEvent} event 
     * @returns 
     */
    onMouseDown( event )
    {
        this.dragging = true;

        this.x = event.clientX;
        this.y = event.clientY;
        this.button = event.button;

        this.dstep = Math.max( this.camera.position[ 0 ], this.camera.position[ 1 ], this.camera.position[ 2 ] ) / 100;

        if ( !this.picker ) return;

        const coordinates = this.get2DCoords( event );
        this.picking = this.picker.find( coordinates, this.scene );

        if ( !this.picking ) this.picker.stop();
    }

    /**
     * canvas 에서의 마우스 이동 이벤트 핸들러.
     * @param {MouseEvent} event 
     * @returns 
     */
    onMouseMove( event )
    {
        this.lastX  = this.x;
        this.lastY  = this.y;
        this.x      = event.clientX;
        this.y      = event.clientY;

        if ( !this.dragging ) return;

        this.ctrl   = event.ctrlKey;
        this.alt    = event.altKey;

        const dx    = this.x - this.lastX;
        const dy    = this.y - this.lastY;

        if ( this.picking && this.picker.moveCallback ) 
        {
            this.picker.moveCallback( dx, dy );
            return;
        }

        if ( !this.button ) 
        {
            this.alt ? this.dolly( dy ) : this.rotate( dx, dy );
        }
    }

    onKeyDown( event ) {
        this.key = event.keyCode;
        this.ctrl = event.ctrlKey;

        if ( this.ctrl ) return;

        switch ( this.key ) {
            case 37:
                return this.camera.changeAzimuth( -this.keyIncrement );
            case 38:
                return this.camera.changeElevation( this.keyIncrement );
            case 39:
                return this.camera.changeAzimuth( this.keyIncrement );
            case 40:
                return this.camera.changeElevation( -this.keyIncrement );
        }
    }

    onKeyUp( event ) {
        if ( event.keyCode === 17 ) {
            this.ctrl = false;
        }
    }

    dolly( value ) {
        if ( value > 0 ) {
            this.dloc += this.dstep;
        } else {
            this.dloc -= this.dstep;
        }

        this.camera.dolly( this.dloc );
    }

    rotate( dx, dy ) {
        const {
            width,
            height
        } = this.canvas;

        const deltaAzimuth = -20 / width;
        const deltaElevation = -20 / height;

        const azimuth = dx * deltaAzimuth * this.motionFactor;
        const elevation = dy * deltaElevation * this.motionFactor;

        this.camera.changeAzimuth( azimuth );
        this.camera.changeElevation( elevation );
    }

}

export default Controls;