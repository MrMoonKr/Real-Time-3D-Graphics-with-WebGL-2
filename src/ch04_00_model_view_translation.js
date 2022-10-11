'use strict';

//import glMatrix from 'gl-matrix' ;
//import { vec3, mat4 } from '../node_modules/gl-matrix/esm/index.js' ;
import { vec3, mat4 } from 'gl-matrix';

import utils from './common/Utils.js' ;
import Clock from './common/Clock.js' ;
import Program from './common/Program.js';
import Scene from './common/Scene.js' ;
import Floor from './common/Floor.js' ;
import Axis from './common/Axis.js' ;

let gl;
let scene;
let program;
let clock;
let WORLD_COORDINATES = 'World Coordinates';
let CAMERA_COORDINATES = 'Camera Coordinates';
let coordinates = WORLD_COORDINATES;
let home = [ 0, -2, -50 ];
let position = [ 0, -2, -50 ];
let rotation = [ 0, 0, 0 ];
let cameraMatrix = mat4.create();
let modelViewMatrix = mat4.create();
let projectionMatrix = mat4.create();
let normalMatrix = mat4.create();

function configure() {
    // Configure `canvas`
    const canvas = utils.getCanvas( 'webgl-canvas' );
    utils.autoResizeCanvas( canvas );

    // Configure `gl`
    gl = utils.getGLContext( canvas );
    gl.clearColor( 0.9, 0.9, 0.9, 1 );
    gl.clearDepth( 1 );
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
function initTransforms() 
{
    mat4.identity( modelViewMatrix );
    mat4.translate( modelViewMatrix, modelViewMatrix, home );

    mat4.identity( cameraMatrix );
    mat4.invert( cameraMatrix, modelViewMatrix );

    mat4.identity( projectionMatrix );

    mat4.identity( normalMatrix );
    mat4.copy( normalMatrix, modelViewMatrix );
    mat4.invert( normalMatrix, normalMatrix );
    mat4.transpose( normalMatrix, normalMatrix );
}

// Update transforms
function updateTransforms() 
{
    mat4.perspective( projectionMatrix, 45, gl.canvas.width / gl.canvas.height, 0.1, 1000 );

    if ( coordinates === WORLD_COORDINATES ) {
        mat4.identity( modelViewMatrix );
        mat4.translate( modelViewMatrix, modelViewMatrix, position );
    } else {
        mat4.identity( cameraMatrix );
        mat4.translate( cameraMatrix, cameraMatrix, position );
    }
}

// Set the matrix uniforms
function setMatrixUniforms() 
{
    if ( coordinates === WORLD_COORDINATES ) {
        mat4.invert( cameraMatrix, modelViewMatrix );
    } else {
        mat4.invert( modelViewMatrix, cameraMatrix );
    }

    gl.uniformMatrix4fv( program.uProjectionMatrix, false, projectionMatrix );
    gl.uniformMatrix4fv( program.uModelViewMatrix, false, modelViewMatrix );
    mat4.transpose( normalMatrix, cameraMatrix );
    gl.uniformMatrix4fv( program.uNormalMatrix, false, normalMatrix );
}

function draw() 
{
    gl.viewport( 0, 0, gl.canvas.width, gl.canvas.height );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    try 
    {
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
    } 
    catch ( error ) 
    {
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

function initControls() 
{
    // DOM element to change values
    const coordinatesElement = document.getElementById( 'coordinates' );

    utils.configureControls( {
        Coordinates: {
            value: coordinates,
            options: [ WORLD_COORDINATES, CAMERA_COORDINATES ],
            onChange: v => {
                coordinates = v;
                coordinatesElement.innerText = coordinates;
                vec3.copy( home, position );
                rotation = [ 0, 0, 0 ];
                if ( coordinates === CAMERA_COORDINATES ) {
                    vec3.negate( position, position );
                }
            }
        },
        ...[ 'Translate X', 'Translate Y', 'Translate Z' ].reduce( ( result, name, i ) => {
            result[ name ] = {
                value: position[ i ],
                min: -100,
                max: 100,
                step: -0.1,
                onChange( v, state ) {
                    position = [
                        state[ 'Translate X' ],
                        state[ 'Translate Y' ],
                        state[ 'Translate Z' ]
                    ];
                }
            };
            return result;
        }, {} ),
    } );

    // On every `tick` (i.e. requestAnimationFrame cycle), invoke callback
    clock.on( 'tick', () => {
        // Update the values in the DOM
        const matrix = ( coordinates === WORLD_COORDINATES ) ? modelViewMatrix : cameraMatrix;
        matrix.forEach( ( data, i ) => 
        {
            document.getElementById( `m${ i }` ).innerText = data.toFixed( 1 );
        } );
    } );
}