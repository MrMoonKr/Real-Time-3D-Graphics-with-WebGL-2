import { mat4, quat, vec2, vec3 } from "gl-matrix";
import Transform from "./Transform";
import { quatFromVec3, sphericalFromVec3, vec3FromSpherical } from "./gl-matrix-extensions";
import Spherical from "./Spherical";



const MOUSE = { LEFT: 0, MIDDLE: 1, RIGHT: 2, ROTATE: 0, DOLLY: 1, PAN: 2 };
const TOUCH = { ROTATE: 0, PAN: 1, DOLLY_PAN: 2, DOLLY_ROTATE: 3 };

const STATE = {
    NONE: -1,
    ROTATE: 0,
    DOLLY: 1,
    PAN: 2,
    TOUCH_ROTATE: 3,
    TOUCH_PAN: 4,
    TOUCH_DOLLY_PAN: 5,
    TOUCH_DOLLY_ROTATE: 6
};

const EPS = 0.000001;

// current position in spherical coordinates
let spherical     = new Spherical() ;
let sphericalDelta = new Spherical() ;

let scale           = 1 ;
const panOffset     = vec3.create() ; // new Vector3();
let zoomChanged     = false ;

const rotateStart   = vec2.create() ; // new Vector2();
const rotateEnd     = vec2.create() ; // new Vector2();
const rotateDelta   = vec2.create() ; // new Vector2();

const panStart      = vec2.create() ; // new Vector2();
const panEnd        = vec2.create() ; // new Vector2();
const panDelta      = vec2.create() ; // new Vector2();

const dollyStart    = vec2.create() ; // new Vector2();
const dollyEnd      = vec2.create() ; // new Vector2();
const dollyDelta    = vec2.create() ; // new Vector2();




class OrbitController
{


    /**
     * object가 domElement로 부터 이벤트를 전달받아 target 주위를 회전.
     * @param {Transform} object 
     * @param {HTMLElement} domElement 
     */
    constructor( object, domElement )
    {
        if ( domElement === undefined ) console.warn( 'OrbitController : The second parameter "domElement" is now mandatory.' );
        if ( domElement === document ) console.error( 'OrbitController : "document" should not be used as the target "domElement". Please use "canvas" instead.' );

        /**
         * @type {Transform} 움직이고자 하는 오브젝트
         */
        this.object         = object ;
        /**
         * @type {HTMLElement} 이벤트를 전달받을 HTML 요소
         */
        this.domElement     = domElement ;
        /** 
         * @type {boolean} 활성화 여부
         */
        this.enabled        = true ;
        /**
         * @type {vec3} 위성같은 움직임의 중심점
         */
        this.target         = vec3.create() ;

        // How far you can dolly in and out ( PerspectiveCamera only )
        this.minDistance    = 0;
        this.maxDistance    = Infinity;

        // How far you can zoom in and out ( OrthographicCamera only )
        this.minZoom = 0;
        this.maxZoom = Infinity;

        // How far you can orbit vertically, upper and lower limits.
        // Range is 0 to Math.PI radians.
        this.minPolarAngle = 0; // radians
        this.maxPolarAngle = Math.PI; // radians

        // How far you can orbit horizontally, upper and lower limits.
        // If set, the interval [ min, max ] must be a sub-interval of [ - 2 PI, 2 PI ], with ( max - min < 2 PI )
        this.minAzimuthAngle = -Infinity; // radians
        this.maxAzimuthAngle = Infinity; // radians

        // Set to true to enable damping (inertia)
        // If damping is enabled, you must call controls.update() in your animation loop
        this.enableDamping = false;
        this.dampingFactor = 0.05;

        // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
        // Set to false to disable zooming
        this.enableZoom = true;
        this.zoomSpeed = 1.0;

        // Set to false to disable rotating
        this.enableRotate = true;
        this.rotateSpeed = 1.0;

        // Set to false to disable panning
        this.enablePan = true;
        this.panSpeed = 1.0;
        this.screenSpacePanning = true; // if false, pan orthogonal to world-space direction camera.up
        this.keyPanSpeed = 7.0; // pixels moved per arrow key push

        // Set to true to automatically rotate around the target
        // If auto-rotate is enabled, you must call controls.update() in your animation loop
        this.autoRotate = false;
        this.autoRotateSpeed = 2.0; // 30 seconds per orbit when fps is 60

        // The four arrow keys
        this.keys = {
            LEFT: 'ArrowLeft',
            UP: 'ArrowUp',
            RIGHT: 'ArrowRight',
            BOTTOM: 'ArrowDown'
        };

        // Mouse buttons
        this.mouseButtons = {
            LEFT: MOUSE.ROTATE,
            MIDDLE: MOUSE.DOLLY,
            RIGHT: MOUSE.PAN
        };

        // Touch fingers
        this.touches = {
            ONE: TOUCH.ROTATE,
            TWO: TOUCH.DOLLY_PAN
        };

        // for reset
        this.target0 = vec3.clone( this.target ) ; // this.target.clone();
        this.position0 = vec3.clone( this.object.position ) ; // this.object.position.clone();
        this.zoom0 = 1.0 ; // this.object.zoom;

        // the target DOM element for key events
        this._domElementKeyEvents = null;


        //
        // internals
        //

        const scope = this;

        // const STATE = {
        //     NONE: -1,
        //     ROTATE: 0,
        //     DOLLY: 1,
        //     PAN: 2,
        //     TOUCH_ROTATE: 3,
        //     TOUCH_PAN: 4,
        //     TOUCH_DOLLY_PAN: 5,
        //     TOUCH_DOLLY_ROTATE: 6
        // };

        this.state = STATE.NONE ;

        

        this.domElement.onpointerdown = event => this.onPointerDown( event ) ;
        //

        //scope.domElement.addEventListener( 'contextmenu', this.onContextMenu ) ;

        //scope.domElement.addEventListener( 'pointerdown', this.onPointerDown ) ;
        //scope.domElement.addEventListener( 'wheel', this.onMouseWheel, { passive: false } ) ;

        //scope.domElement.addEventListener( 'touchstart', this.onTouchStart, { passive: false } ) ;
        //scope.domElement.addEventListener( 'touchend', this.onTouchEnd );
        //scope.domElement.addEventListener( 'touchmove', this.onTouchMove, { passive: false } ) ;

        // force an update at start

        //this.update();


    }


    test01()
    {
        // 회전 테스트
        //this.object.rotateX( 2 ) ;
        //this.object.rotateY( 2 ) ;
        //this.object.rotateZ( 2 ) ;

        // 바라보기 테스트
        //vec3.add( this.target, this.target, vec3.fromValues( 0.1, 0.0, 0.0 ) ); // just test
        //this.object.look( this.target ) ;

        // 중심회전 테스트
        const offset = vec3.create() ;
        vec3.sub( offset, this.object.position, this.target ) ;

        const spherical = sphericalFromVec3( offset ) ;
        spherical.theta += 1 * Math.PI / 180 ;
        //spherical.phi -= 1 * Math.PI / 180 ;
        if ( spherical.phi <= 0 ) spherical.phi = Math.PI ;

        const newoffset = vec3FromSpherical( spherical ) ;

        this.object.setPosition( newoffset[0], newoffset[1], newoffset[2] ) ;
        this.object.look( this.target ) ;
    }

    update()
    {
        //this.test01() ;

        return ;


        const up                = vec3.fromValues( this.object.transformMatrix[4], this.object.transformMatrix[5], this.object.transformMatrix[6] );
        const rot               = quatFromVec3( up, vec3.create( 0, 1, 0 ) ) ; // new Quaternion().setFromUnitVectors( object.up, new Vector3( 0, 1, 0 ) );
        const rotInverse        = quat.create() ;
        quat.invert( rotInverse, rot ) ;
        const lastPosition      = vec3.create() ;
        const lastQuaternion    = quat.create() ;
        const twoPI             = 2 * Math.PI ;
        
        
        // 
        
        const position          = vec3.create() ;
        const offset            = vec3.create() ;

        vec3.copy( position, this.object.position ) ;
        vec3.sub( offset, position, this.target ) ;

        // rotate offset to "y-axis-is-up" space
        //offset.applyQuaternion( rot );
        //vec3.transformQuat( offset, offset, rot ) ;

        // angle from z-axis around y-axis
        spherical.setFromVector3( offset );

        // if ( this.autoRotate && this.state === STATE.NONE )
        // {
        //     this.rotateLeft( this.getAutoRotationAngle() );
        // }

        if ( this.enableDamping )
        {
            spherical.theta += sphericalDelta.theta * this.dampingFactor ;
            spherical.phi   += sphericalDelta.phi   * this.dampingFactor ;

        }
        else
        {
            spherical.theta += sphericalDelta.theta ;
            spherical.phi   += sphericalDelta.phi ;
        }

        // restrict theta to be between desired limits

        let min = this.minAzimuthAngle ;
        let max = this.maxAzimuthAngle ;

        if ( isFinite( min ) && isFinite( max ) )
        {
            if ( min < - Math.PI ) min += twoPI ; else if ( min > Math.PI ) min -= twoPI ;
            if ( max < - Math.PI ) max += twoPI ; else if ( max > Math.PI ) max -= twoPI ;

            if ( min <= max )
            {
                spherical.theta = Math.max( min, Math.min( max, spherical.theta ) ) ;

            }
            else
            {
                spherical.theta = ( spherical.theta > ( min + max ) / 2 ) ?
                    Math.max( min, spherical.theta ) :
                    Math.min( max, spherical.theta ) ;
            }
        }

        // restrict phi to be between desired limits
        spherical.phi = Math.max( this.minPolarAngle, Math.min( this.maxPolarAngle, spherical.phi ) ) ;

        spherical.makeSafe() ;

        spherical.radius *= scale ;

        // restrict radius to be between desired limits
        spherical.radius = Math.max( this.minDistance, Math.min( this.maxDistance, spherical.radius ) ) ;

        //return;

        // move target to panned location

        // if ( this.enableDamping === true )
        // {
        //     //this.target.addScaledVector( panOffset, this.dampingFactor ) ;
        //     vec3.scale( panOffset, panOffset, this.dampingFactor ) ;
        //     vec3.scale( this.target, this.target, panOffset ) ;
        // } 
        // else 
        // {
        //     //this.target.add( panOffset );
        //     vec3.add( this.target, this.target, panOffset ) ;
        // }

        //return;

        //offset.setFromSpherical( spherical ) ;
        //offset = vec3FromSpherical( spherical ) ;

        spherical.radius += 10.0 ;
        const temp = vec3FromSpherical( spherical ) ;
        console.log( 'temp : ' + temp.toString() ) ;
        vec3.copy( offset, offset, temp ) ;


        // rotate offset back to "camera-up-vector-is-up" space
        //offset.applyQuaternion( quatInverse ) ;
        //vec3.transformQuat( offset, offset, rotInverse ) ;

        //position.copy( this.target ).add( offset );

        //vec3.add( position, this.target, offset ) ;



        //vec3.add( this.target, this.target, vec3.fromValues( 0.1, 0.0, 0.0 ) ); // just test
        this.object.look( this.target ) ;

        //console.log( 'offset :'  + offset.toString() ) ;
        //console.log( 'spherical start :'  + spherical.toString() ) ;
        //console.log( 'spherical delta : ' + sphericalDelta.toString() ) ;
        //console.log( 'object at ' + this.object.position.toString() ) ;
        //console.log( 'object look at ' + this.target.toString() ) ;

        // if ( this.enableDamping === true )
        // {
        //     sphericalDelta.theta *= ( 1 - this.dampingFactor ) ;
        //     sphericalDelta.phi   *= ( 1 - this.dampingFactor ) ;

        //     panOffset.multiplyScalar( 1 - this.dampingFactor ) ;
        // } 
        // else
        // {
        //     sphericalDelta.set( 0, 0, 0 ) ;

        //     panOffset.set( 0, 0, 0 ) ;
        // }

        scale = 1 ;

        // update condition is:
        // min( camera displacement, camera rotation in radians ) ^ 2 > EPS
        // using small-angle approximation cos(x/2) = 1 - x^2 / 8

        if ( zoomChanged //||
            // lastPosition.distanceToSquared( this.object.position ) > EPS ||
            // 8 * ( 1 - lastQuaternion.dot( this.object.rotation ) ) > EPS 
            )
        {

            //this.dispatchEvent( _changeEvent );

            //lastPosition.copy( this.object.position ) ;
            //lastQuaternion.copy( this.object.rotation ) ;
            zoomChanged = false;

            return true ;
        }

        return false ;
    }


    //
    // event callbacks - update the object state
    //

    /**
     * 
     * @param {PointerEvent} event 
     */
    handleMouseDownRotate( event ) 
    {
        console.log( 'handleMouseDownRotate() 호출됨 : ' + rotateStart.toString() ) ;

        vec2.set( rotateStart, event.clientX, event.clientY ) ;

        const offset = vec3.create() ;
        vec3.sub( offset, this.object.position, this.target ) ;

        spherical       = sphericalFromVec3( offset ) ;
        sphericalDelta  = sphericalFromVec3( offset ) ;
    }
    /**
     * 
     * @param {PointerEvent} event 
     */
    handleMouseMoveRotate( event )
    {
        vec2.set( rotateEnd, event.clientX, event.clientY ) ;

        vec2.sub( rotateDelta, rotateEnd, rotateStart ) ;
        vec2.scale( rotateDelta, rotateDelta, this.rotateSpeed ) ;
        
        const element = this.domElement ;

        //console.log( '회전 델타 : ' + rotateDelta[0] ) ;
        const deltaX =  1 * ( Math.PI / 180 ) * rotateDelta[0] ;
        const deltaY =  1 * ( Math.PI / 180 ) * rotateDelta[1] ;

        sphericalDelta.theta += deltaX ;
        sphericalDelta.phi   += deltaY ;
        
        //this.rotateLeft( 200 * Math.PI * rotateDelta[0] / element.clientHeight ) ; // yes, height
        //this.rotateUp( 200 * Math.PI * rotateDelta[1] / element.clientHeight ) ;

        const newoffset = vec3FromSpherical( sphericalDelta ) ;
        //console.log( '옵셋 : ' + newoffset ) ;

        this.object.setPosition( newoffset[0], newoffset[1], newoffset[2] ) ;
        this.object.look( this.target ) ;
        
        //rotateStart.copy( rotateEnd );
        vec2.copy( rotateStart, rotateEnd ) ;
        
        //this.update() ;

        //console.log( 'handleMouseMoveRotate() 호출됨 : ' + rotateDelta.toString() + ' : ' + rotateEnd.toString() ) ;
        console.log( 'handleMouseMoveRotate() 호출됨 : ' + rotateDelta.toString() + ' : ' + rotateEnd.toString() ) ;
    }

    /**
     * 
     * @param {PointerEvent} event 
     */
    handleMouseDownPan( event )
    {
        console.log( 'handleMouseDownPan() 호출됨 : ' ) ;
        vec2.set( panStart, event.clientX, event.clientY ) ;

    }
    /**
     * 
     * @param {PointerEvent} event 
     */
    handleMouseMovePan( event )
    {
        
        vec2.set( panEnd, event.clientX, event.clientY ) ;

        vec2.sub( panDelta, panEnd, panStart ) ;
        vec2.scale( panDelta, panDelta, this.panSpeed ) ;

        const offset = vec3.create() ;
        vec3.sub( offset, this.object.position, this.target ) ;

        let targetDistance = vec3.length( offset ) ;

        const panOffset = vec3.create() ;
        vec3.add( panOffset, panOffset, vec3.fromValues( 1 * panDelta[0], 1 * panDelta[1], 0 ) ) ;

        console.log( 'panOffset : ' + panOffset.toString() ) ;

        const newPos = vec3.create() ;
        vec3.add( newPos, this.object.position, panOffset ) ;

        this.object.setPosition( newPos[0], newPos[1], newPos[2] ) ;

        vec3.add( this.target, this.target, panOffset ) ;

        //this.pan( panDelta.x, panDelta.y );
        //this.pan( panDelta[0], panDelta[1] ) ;

        //panStart.copy( panEnd );
        vec2.copy( panStart, panEnd ) ;

        //this.update();

        console.log( 'handleMouseMovePan() 호출됨 : ' ) ;
    }


    
    /**
     * 
     * @param {PointerEvent} event 
     */
    handleMouseUp( event )
    {
        console.log( 'handleMouseUp() : ' + event.type ) ;
    }



    handleMouseDownDolly( event ) 
    {

        dollyStart.set( event.clientX, event.clientY );

    }


    

    handleMouseMoveDolly( event )
    {

        dollyEnd.set( event.clientX, event.clientY );

        dollyDelta.subVectors( dollyEnd, dollyStart );

        if ( dollyDelta.y > 0 ) {

            dollyOut( getZoomScale() );

        } else if ( dollyDelta.y < 0 ) {

            dollyIn( getZoomScale() );

        }

        dollyStart.copy( dollyEnd );

        scope.update();

    }




    handleMouseWheel( event ) {

        if ( event.deltaY < 0 ) {

            dollyIn( getZoomScale() );

        } else if ( event.deltaY > 0 ) {

            dollyOut( getZoomScale() );

        }

        scope.update();

    }

    handleKeyDown( event ) {

        let needsUpdate = false;

        switch ( event.code ) {

            case scope.keys.UP:
                pan( 0, scope.keyPanSpeed );
                needsUpdate = true;
                break;

            case scope.keys.BOTTOM:
                pan( 0, -scope.keyPanSpeed );
                needsUpdate = true;
                break;

            case scope.keys.LEFT:
                pan( scope.keyPanSpeed, 0 );
                needsUpdate = true;
                break;

            case scope.keys.RIGHT:
                pan( -scope.keyPanSpeed, 0 );
                needsUpdate = true;
                break;

        }

        if ( needsUpdate ) {

            // prevent the browser from scrolling on cursor keys
            event.preventDefault();

            scope.update();

        }


    }

    handleTouchStartRotate( event ) {

        if ( event.touches.length == 1 ) {

            rotateStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

        } else {

            const x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
            const y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

            rotateStart.set( x, y );

        }

    }

    handleTouchStartPan( event ) {

        if ( event.touches.length == 1 ) {

            panStart.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

        } else {

            const x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
            const y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

            panStart.set( x, y );

        }

    }

    handleTouchStartDolly( event ) {

        const dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
        const dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

        const distance = Math.sqrt( dx * dx + dy * dy );

        dollyStart.set( 0, distance );

    }

    handleTouchStartDollyPan( event ) {

        if ( scope.enableZoom ) handleTouchStartDolly( event );

        if ( scope.enablePan ) handleTouchStartPan( event );

    }

    handleTouchStartDollyRotate( event ) {

        if ( scope.enableZoom ) handleTouchStartDolly( event );

        if ( scope.enableRotate ) handleTouchStartRotate( event );

    }

    handleTouchMoveRotate( event ) {

        if ( event.touches.length == 1 ) {

            rotateEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

        } else {

            const x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
            const y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

            rotateEnd.set( x, y );

        }

        rotateDelta.subVectors( rotateEnd, rotateStart ).multiplyScalar( scope.rotateSpeed );

        const element = scope.domElement;

        rotateLeft( 2 * Math.PI * rotateDelta.x / element.clientHeight ); // yes, height

        rotateUp( 2 * Math.PI * rotateDelta.y / element.clientHeight );

        rotateStart.copy( rotateEnd );

    }

    handleTouchMovePan( event ) {

        if ( event.touches.length == 1 ) {

            panEnd.set( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY );

        } else {

            const x = 0.5 * ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX );
            const y = 0.5 * ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY );

            panEnd.set( x, y );

        }

        panDelta.subVectors( panEnd, panStart ).multiplyScalar( scope.panSpeed );

        pan( panDelta.x, panDelta.y );

        panStart.copy( panEnd );

    }

    handleTouchMoveDolly( event ) {

        const dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
        const dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;

        const distance = Math.sqrt( dx * dx + dy * dy );

        dollyEnd.set( 0, distance );

        dollyDelta.set( 0, Math.pow( dollyEnd.y / dollyStart.y, scope.zoomSpeed ) );

        dollyOut( dollyDelta.y );

        dollyStart.copy( dollyEnd );

    }

    handleTouchMoveDollyPan( event ) {

        if ( scope.enableZoom ) handleTouchMoveDolly( event );

        if ( scope.enablePan ) handleTouchMovePan( event );

    }

    handleTouchMoveDollyRotate( event ) {

        if ( scope.enableZoom ) handleTouchMoveDolly( event );

        if ( scope.enableRotate ) handleTouchMoveRotate( event );

    }

    handleTouchEnd( /*event*/) {

        // no-op

    }

    //
    // event handlers - FSM: listen for events and reset state
    //

    /**
     * 
     * @param {PointerEvent} event 
     * @returns 
     */
    onPointerDown( event ) 
    {
        if ( this.enabled === false ) return ;

        switch ( event.pointerType )
        {
            case 'mouse':
            case 'pen':
                this.onMouseDown( event );
                break;

                // TODO touch
        }
    }
    /**
     * 
     * @param {PointerEvent} event 
     * @returns 
     */
    onPointerMove( event )
    {
        if ( this.enabled === false ) return ;

        switch ( event.pointerType )
        {
            case 'mouse':
            case 'pen':
                this.onMouseMove( event );
                break;

                // TODO touch
        }
    }
    /**
     * 
     * @param {PointerEvent} event 
     */
    onPointerUp( event )
    {
        switch ( event.pointerType )
        {
            case 'mouse':
            case 'pen':
                this.onMouseUp( event );
                break;

                // TODO touch
        }
    }

    /**
     * 
     * @param {PointerEvent} event 
     * @returns 
     */
    onMouseDown( event )
    {
        // Prevent the browser from scrolling.
        event.preventDefault();

        // Manually set the focus since calling preventDefault above
        // prevents the browser from setting it automatically.

        this.domElement.focus ? this.domElement.focus() : window.focus() ;

        let mouseAction ;

        switch ( event.button )
        {
            case 0:
                mouseAction = this.mouseButtons.LEFT ;
                break;

            case 1:
                mouseAction = this.mouseButtons.MIDDLE ;
                break;

            case 2:
                mouseAction = this.mouseButtons.RIGHT ;
                break;

            default:
                mouseAction = -1;
        }

        switch ( mouseAction )
        {
            case MOUSE.DOLLY:
                if ( this.enableZoom === false ) return ;

                this.handleMouseDownDolly( event ) ;
                this.state = STATE.DOLLY ;

                break;

            case MOUSE.ROTATE:
                if ( event.ctrlKey || event.metaKey || event.shiftKey )
                {
                    if ( this.enablePan === false ) return ;

                    this.handleMouseDownPan( event ) ;
                    this.state = STATE.PAN ;
                }
                else 
                {
                    if ( this.enableRotate === false ) return ;

                    this.handleMouseDownRotate( event ) ;
                    this.state = STATE.ROTATE ;
                }

                break;

            case MOUSE.PAN:
                if ( event.ctrlKey || event.metaKey || event.shiftKey )
                {
                    if ( this.enableRotate === false ) return ;

                    this.handleMouseDownRotate( event ) ;
                    this.state = STATE.ROTATE ;
                }
                else
                {
                    if ( this.enablePan === false ) return ;

                    this.handleMouseDownPan( event ) ;
                    this.state = STATE.PAN ;
                }

                break;

            default:
                this.state = STATE.NONE ;
        }

        if ( this.state !== STATE.NONE )
        {
            this.domElement.ownerDocument.onpointermove = event => this.onPointerMove( event ) ;
            this.domElement.ownerDocument.onpointerup   = event => this.onPointerUp( event ) ;
            //this.domElement.ownerDocument.addEventListener( 'pointermove', this.onPointerMove ) ;
            //this.domElement.ownerDocument.addEventListener( 'pointerup', this.onPointerUp ) ;

            //scope.dispatchEvent( _startEvent );
        }
    }
    /**
     * 
     * @param {PointerEvent} event 
     * @returns 
     */
    onMouseMove( event )
    {
        if ( this.enabled === false ) return ;

        event.preventDefault() ;

        switch ( this.state )
        {
            case STATE.ROTATE:

                if ( this.enableRotate === false ) return ;

                this.handleMouseMoveRotate( event ) ;

                break;

            case STATE.DOLLY:

                if ( this.enableZoom === false ) return ;

                //this.handleMouseMoveDolly( event ) ;

                break;

            case STATE.PAN:

                if ( this.enablePan === false ) return ;

                this.handleMouseMovePan( event ) ;

                break;

        }
    }
    /**
     * 
     * @param {PointerEvent} event 
     * @returns 
     */
    onMouseUp( event )
    {
        this.domElement.ownerDocument.onpointermove = event => { } ;
        this.domElement.ownerDocument.onpointerup   = event => { } ;
        //this.domElement.ownerDocument.removeEventListener( 'pointermove', this.onPointerMove ) ;
        //this.domElement.ownerDocument.removeEventListener( 'pointerup', this.onPointerUp ) ;

        if ( this.enabled === false ) return ;

        this.handleMouseUp( event );

        //scope.dispatchEvent( _endEvent );

        this.state = STATE.NONE ;
    }

    /**
     * 
     * @param {WheelEvent} event 
     * @returns 
     */
    onMouseWheel( event )
    {
        if ( this.enabled === false || this.enableZoom === false || ( this.state !== STATE.NONE && this.state !== STATE.ROTATE ) ) return ;

        event.preventDefault() ;

        //scope.dispatchEvent( _startEvent );

        this.handleMouseWheel( event );

        //scope.dispatchEvent( _endEvent );

    }

    onKeyDown( event ) {

        if ( scope.enabled === false || scope.enablePan === false ) return;

        handleKeyDown( event );

    }

    /**
     * 
     * @param {TouchEvent} event 
     * @returns 
     */
    onTouchStart( event ) 
    {
        if ( this.enabled === false ) return ;

        event.preventDefault() ; // prevent scrolling

        switch ( event.touches.length )
        {
            case 1:
                switch ( this.touches.ONE )
                {
                    case TOUCH.ROTATE:

                        if ( this.enableRotate === false ) return ;

                        this.handleTouchStartRotate( event ) ;
                        this.state = STATE.TOUCH_ROTATE ;

                        break;

                    case TOUCH.PAN:

                        if ( this.enablePan === false ) return ;

                        this.handleTouchStartPan( event ) ;
                        this.state = STATE.TOUCH_PAN ;

                        break;

                    default:
                        this.state = STATE.NONE ;
                }

                break;

            case 2:
                switch ( this.touches.TWO )
                {
                    case TOUCH.DOLLY_PAN:

                        if ( this.enableZoom === false && this.enablePan === false ) return ;

                        this.handleTouchStartDollyPan( event ) ;
                        this.state = STATE.TOUCH_DOLLY_PAN ;

                        break;

                    case TOUCH.DOLLY_ROTATE:

                        if ( this.enableZoom === false && this.enableRotate === false ) return ;

                        this.handleTouchStartDollyRotate( event ) ;
                        this.state = STATE.TOUCH_DOLLY_ROTATE ;

                        break;

                    default:
                        this.state = STATE.NONE ;

                }

                break;

            default:
                this.state = STATE.NONE ;

        }

        if ( this.state !== STATE.NONE )
        {
            //scope.dispatchEvent( _startEvent );
        }

    }
    /**
     * 
     * @param {TouchEvent} event 
     * @returns 
     */
    onTouchMove( event )
    {
        if ( this.enabled === false ) return ;

        event.preventDefault() ; // prevent scrolling

        switch ( this.state )
        {
            case STATE.TOUCH_ROTATE:

                if ( this.enableRotate === false ) return ;

                this.handleTouchMoveRotate( event ) ;
                this.update() ;

                break;

            case STATE.TOUCH_PAN:

                if ( this.enablePan === false ) return ;

                this.handleTouchMovePan( event ) ;
                this.update() ;

                break;

            case STATE.TOUCH_DOLLY_PAN:

                if ( this.enableZoom === false && this.enablePan === false ) return ;

                this.handleTouchMoveDollyPan( event ) ;
                this.update() ;

                break;

            case STATE.TOUCH_DOLLY_ROTATE:

                if ( this.enableZoom === false && this.enableRotate === false ) return ;

                this.handleTouchMoveDollyRotate( event ) ;
                this.update() ;

                break;

            default:

                this.state = STATE.NONE ;

        }
    }
    /**
     * 
     * @param {TouchEvent} event 
     * @returns 
     */
    onTouchEnd( event )
    {
        if ( this.enabled === false ) return ;

        //handleTouchEnd( event );

        //scope.dispatchEvent( _endEvent );

        this.state = STATE.NONE ;

    }

    /**
     * 
     * @param {MouseEvent} event 
     * @returns 
     */
    onContextMenu( event ) 
    {
        if ( this.enabled === false ) return;
        event.preventDefault();
    }






    getAutoRotationAngle()
    {
        return 2 * Math.PI / 60 / 60 * this.autoRotateSpeed ;
    }

    getZoomScale() {

        return Math.pow( 0.95, scope.zoomSpeed );

    }

    rotateLeft( angle )
    {
        console.log( 'rotateLeft() : ' + angle ) ;
        sphericalDelta.theta -= angle;
    }

    rotateUp( angle )
    {
        console.log( 'rotateUp() : ' + angle ) ;
        sphericalDelta.phi -= angle;
    }


    /**
     * 
     * @param {number} distance 
     * @param {mat4} objectMatrix 
     */
    panLeft( distance, objectMatrix )
    {
        const v = vec3.create() ;
        vec3.fromValues( v, objectMatrix[0], objectMatrix[1], objectMatrix[2] ) ;
        vec3.scale( v, v, distance ) ;

        vec3.add( panOffset, panOffset, v ) ;

        console.log( 'panLeft()' + panOffset.toString() ) ;
    }

    /**
     * 
     * @param {number} distance 
     * @param {mat4} objectMatrix 
     */
    panUp( distance, objectMatrix )
    {
        const v = vec3.create() ;

        if ( this.screenSpacePanning === true )
        {
            vec3.fromValues( v, objectMatrix[4], objectMatrix[5], objectMatrix[6] ) ; // object's Y-Axis
        }
        else
        {
            vec3.fromValues( v, objectMatrix[0], objectMatrix[1], objectMatrix[2] ) ; // object's X-Axis
            vec3.cross( v, v, vec3.fromValues( 0.0, 1.0, 0.0 ) ) ; // world's Y-Axis
        }

        vec3.scale( v, v, distance ) ;

        vec3.add( panOffset, panOffset, v ) ;

        console.log( 'panUp()' + panOffset.toString() ) ;
    }

    /**
     * 
     * @param {number} deltaX 
     * @param {number} deltaY 
     */
    pan( deltaX, deltaY )
    {
        const element = this.domElement ;

        const offset = vec3.create() ;

        //if ( this.object.isPerspectiveCamera )
        {
            // perspective
            const position = this.object.position ;

            //offset.copy( position ).sub( this.target );
            vec3.copy( offset, position ) ;
            vec3.sub( offset, this.target ) ;

            let targetDistance = offset.length() ;

            // half of the fov is center to top of screen
            // targetDistance *= Math.tan( ( this.object.fov / 2 ) * Math.PI / 180.0 ) ;

            // we use only clientHeight here so aspect ratio does not distort speed
            this.panLeft( 2 * deltaX * targetDistance / element.clientHeight, this.object.getTransformMatrix() );
            this.panUp(   2 * deltaY * targetDistance / element.clientHeight, this.object.getTransformMatrix() );

        } 
        // else if ( this.object.isOrthographicCamera )
        // {
        //     // orthographic
        //     panLeft( deltaX * ( scope.object.right - scope.object.left ) / scope.object.zoom / element.clientWidth, scope.object.matrix );
        //     panUp( deltaY * ( scope.object.top - scope.object.bottom ) / scope.object.zoom / element.clientHeight, scope.object.matrix );
        // } 
        // else
        // {
        //     // camera neither orthographic nor perspective
        //     console.warn( 'WARNING: OrbitController.js encountered an unknown camera type - pan disabled.' ) ;
        //     this.enablePan = false ;
        // }
    }


}


export default OrbitController ;
