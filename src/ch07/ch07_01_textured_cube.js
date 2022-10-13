import {
    vec3,
    mat4
} from 'gl-matrix';

import * as THREE from 'three';
import {
    OrbitControls
} from 'three/addons/controls/OrbitControls.js';

import utils from '../common/Utils.js';
import Clock from '../common/Clock.js';
import Program from '../common/Program.js';
import Scene from '../common/Scene.js';
//import Floor from '../common/Floor.js' ;
//import Axis from '../common/Axis.js' ;
import Camera from '../common/Camera.js';
import Controls from '../common/Controls.js';
//import Picker from '../common/Picker.js';
import Transforms from '../common/Transforms.js';
import Texture from '../common/Texture.js';





let gl;
let canvas;
let scene;
let program;
let camera, transforms, clock,
    useVertexColors = false;

function configure() 
{
    const canvas = utils.getCanvas( 'webgl-canvas' );
    utils.autoResizeCanvas( canvas );

    gl = utils.getGLContext( canvas );
    gl.clearColor( 0.9, 0.9, 0.9, 1 );
    gl.clearDepth( 100 );
    gl.enable( gl.DEPTH_TEST );
    gl.depthFunc( gl.LESS );
    gl.enable( gl.BLEND );
    gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );
    gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, true );

    program = new Program( gl, 'vertex-shader', 'fragment-shader' );

    const attributes = [
        'aVertexPosition',
        'aVertexNormal',
        'aVertexColor'
    ];

    const uniforms = [
        'uProjectionMatrix',
        'uModelViewMatrix',
        'uNormalMatrix',
        'uMaterialDiffuse',
        'uMaterialAmbient',
        'uLightAmbient',
        'uLightDiffuse',
        'uLightPosition',
        'uWireframe',
        'uAlpha',
        'uUseVertexColor',
        'uUseLambert'
    ];

    program.load( attributes, uniforms );

    clock = new Clock();

    scene = new Scene( gl, program );

    camera = new Camera( Camera.ORBITING_TYPE );
    camera.goHome( [ 0, 0, 4 ] );
    camera.setFocus( [ 0, 0, 0 ] );
    camera.setAzimuth( 45 );
    camera.setElevation( -30 );
    new Controls( camera, canvas );

    transforms = new Transforms( gl, program, camera, canvas );

    gl.uniform3fv( program.uLightPosition, [ 0, 5, 20 ] );
    gl.uniform3fv( program.uLightAmbient, [ 1, 1, 1, 1 ] );
    gl.uniform4fv( program.uLightDiffuse, [ 1, 1, 1, 1 ] );
    gl.uniform1f( program.uAlpha, 1.0 );
    gl.uniform1i( program.uUseVertexColor, useVertexColors );
    gl.uniform1i( program.uUseLambert, true );
}

function load() {
    scene.load( '/common/models/geometries/cube-texture.json' );
}

function draw() {
    gl.viewport( 0, 0, gl.canvas.width, gl.canvas.height );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    transforms.updatePerspective();

    try {
        scene.traverse( object => {
            if ( object.hidden ) return;

            transforms.calculateModelView();
            transforms.push();
            transforms.setMatrixUniforms();
            transforms.pop();

            gl.uniform4fv( program.uMaterialDiffuse, object.diffuse );
            gl.uniform4fv( program.uMaterialAmbient, object.ambient );
            gl.uniform1i( program.uWireframe, object.wireframe );
            gl.uniform1i( program.uUseVertexColor, useVertexColors );

            // Bind
            gl.bindVertexArray( object.vao );
            gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, object.ibo );

            // Draw
            if ( object.wireframe ) {
                gl.drawElements( gl.LINES, object.indices.length, gl.UNSIGNED_SHORT, 0 );
            } else {
                gl.enable( gl.CULL_FACE );
                gl.cullFace( gl.FRONT );
                gl.drawElements( gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0 );
                gl.cullFace( gl.BACK );
                gl.drawElements( gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0 );
                gl.disable( gl.CULL_FACE );
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
        'Use Lambert Term': {
            value: true,
            onChange: v => gl.uniform1i( program.uUseLambert, v )
        },
        'Use Per Vertex': {
            value: useVertexColors,
            onChange: v => useVertexColors = v
        },
        'Alpha Value': {
            value: 1,
            min: 0,
            max: 1,
            step: 0.1,
            onChange: v => gl.uniform1f( program.uAlpha, v )
        }
    } );
}
