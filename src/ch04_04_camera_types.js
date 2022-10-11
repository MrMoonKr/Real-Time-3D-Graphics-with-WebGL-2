'use strict';

import { vec3, mat4 } from 'gl-matrix';

import utils from './common/Utils.js' ;
import Clock from './common/Clock.js' ;
import Program from './common/Program.js';
import Scene from './common/Scene.js' ;
import Floor from './common/Floor.js' ;
import Axis from './common/Axis.js' ;
import Camera from './common/Camera.js';
import Controls from './common/Controls.js';

/**
 * @type {WebGL2RenderingContext}
 */
let gl;
/**
 * @type {Scene}
 */
let scene;
/**
 * @type {Program}
 */
let program;
/**
 * @type {Camera}
 */
let camera;
/**
 * @type {Clock}
 */
let clock;

let modelViewMatrix = mat4.create();
let projectionMatrix = mat4.create();
let normalMatrix = mat4.create();

function configure() {
    /**
     * @type {HTMLCanvasElement}
     */
    const canvas = utils.getCanvas( 'webgl-canvas' );
    utils.autoResizeCanvas( canvas );

    gl = utils.getGLContext( canvas );
    gl.clearColor( 0.9, 0.9, 0.9, 1 );
    gl.clearDepth( 100 );
    gl.enable( gl.DEPTH_TEST );
    gl.depthFunc( gl.LEQUAL );

    // Configure `clock` which we can subscribe to on every `tick`.
    // We will discuss this in a later chapter, but it's simply a way to
    // abstract away the `requestAnimationFrame` we have been using.
    clock = new Clock();

    // Configure `program`
    program = new Program( gl, 'vertex-shader', 'fragment-shader' );

    // Uniforms to be set
    const uniforms = [
        'uProjectionMatrix',
        'uModelViewMatrix',
        'uNormalMatrix',
        'uMaterialDiffuse',
        'uLightAmbient',
        'uLightDiffuse',
        'uLightPosition',
        'uWireframe'
    ];

    // Attributes to be set
    const attributes = [
        'aVertexPosition',
        'aVertexNormal',
        'aVertexColor'
    ];

    // Load uniforms and attributes
    program.load( attributes, uniforms );

    // Configure `scene`. We will discuss this in a later chapter, but
    // this is a simple way to add objects into our scene, rather than
    // maintaining sets of global arrays as we've done in previous chapters.
    scene = new Scene( gl, program );

    // Configure `camera` and set it to be in tracking mode
    camera = new Camera( Camera.ORBITING_TYPE );
    camera.goHome( [ 0, 2, 50 ] );

    // Configure controls by allowing user driven events to move camera around
    new Controls( camera, canvas );

    // Configure lights
    gl.uniform3fv( program.uLightPosition, [ 0, 120, 120 ] );
    gl.uniform4fv( program.uLightAmbient, [ 0.20, 0.20, 0.20, 1 ] );
    gl.uniform4fv( program.uLightDiffuse, [ 1, 1, 1, 1 ] );

    initTransforms();
}

// Load objects into our `scene`
function load() {
    scene.add( new Floor( 80, 2 ) );
    scene.add( new Axis( 82 ) );
    scene.load( '/common/models/geometries/cone3.json', 'cone' );
}

// Initialize the necessary transforms
function initTransforms() {
    modelViewMatrix = camera.getViewTransform();
    mat4.identity( projectionMatrix );
    updateTransforms();
    mat4.identity( normalMatrix );
    mat4.copy( normalMatrix, modelViewMatrix );
    mat4.invert( normalMatrix, normalMatrix );
    mat4.transpose( normalMatrix, normalMatrix );
}

// Update transforms
function updateTransforms() {
    mat4.perspective( projectionMatrix, 45, gl.canvas.width / gl.canvas.height, 0.1, 1000 );
}

// Set the matrix uniforms
function setMatrixUniforms() {
    gl.uniformMatrix4fv( program.uModelViewMatrix, false, camera.getViewTransform() );
    gl.uniformMatrix4fv( program.uProjectionMatrix, false, projectionMatrix );
    mat4.transpose( normalMatrix, camera.matrix );
    gl.uniformMatrix4fv( program.uNormalMatrix, false, normalMatrix );
}

function draw() {
    gl.viewport( 0, 0, gl.canvas.width, gl.canvas.height );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    try {
        updateTransforms();
        setMatrixUniforms();

        // Iterate over every object in the scene
        scene.traverse( object => {
            gl.uniform4fv( program.uMaterialDiffuse, object.diffuse );
            gl.uniform1i( program.uWireframe, object.wireframe );

            // Bind
            gl.bindVertexArray( object.vao );
            gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, object.ibo );

            // Draw
            if ( object.wireframe ) {
                gl.drawElements( gl.LINES, object.indices.length, gl.UNSIGNED_SHORT, 0 );
            } else {
                gl.drawElements( gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0 );
            }

            // Clean
            gl.bindVertexArray( null );
            gl.bindBuffer( gl.ARRAY_BUFFER, null );
            gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
        } );
    } catch ( error ) {
        console.error( error );
    }
}

function init() {
    configure();
    load();
    clock.on( 'tick', draw );

    initControls();
}

window.onload = init;

function initControls() {
    utils.configureControls( {
        'Camera Type': {
            value: camera.type,
            options: [ Camera.TRACKING_TYPE, Camera.ORBITING_TYPE ],
            onChange: v => {
                camera.goHome();
                camera.setType( v );
            }
        },
        Dolly: {
            value: 0,
            min: -100,
            max: 100,
            step: 0.1,
            onChange: v => camera.dolly( v )
        },
        Position: {
            ...[ 'X', 'Y', 'Z' ].reduce( ( result, name, i ) => {
                result[ name ] = {
                    value: camera.position[ i ],
                    min: -100,
                    max: 100,
                    step: 0.1,
                    onChange: ( v, state ) => {
                        camera.setPosition( [
                            state.X,
                            state.Y,
                            state.Z
                        ] );
                    }
                };
                return result;
            }, {} ),
        },
        Rotation: {
            Elevation: {
                value: camera.elevation,
                min: -180,
                max: 180,
                step: 0.1,
                onChange: v => camera.setElevation( v )
            },
            Azimuth: {
                value: camera.azimuth,
                min: -180,
                max: 180,
                step: 0.1,
                onChange: v => camera.setAzimuth( v )
            }
        },
        'Go Home': () => camera.goHome()
    } );

    // On every `tick` (i.e. requestAnimationFrame cycle), invoke callback
    clock.on( 'tick', () => {
        camera.matrix.forEach( ( data, i ) => {
            document.getElementById( `m${ i }` ).innerText = data.toFixed( 1 );
        } );
    } );
}