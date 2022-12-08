'use strict';

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


let gl, scene, program, camera, transforms, clock, texture, texture2;

function configure() 
{
    const canvas = utils.getCanvas( 'webgl-canvas' );
    utils.autoResizeCanvas( canvas );

    gl = utils.getGLContext( canvas );
    gl.clearColor( 0.9, 0.9, 0.9, 1 );
    gl.clearDepth( 100 );
    gl.enable( gl.DEPTH_TEST );
    gl.depthFunc( gl.LESS );
    gl.pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, true );

    program = new Program( gl, 'vertex-shader', 'fragment-shader' );

    const attributes = [
        'aVertexPosition',
        'aVertexTextureCoords'
    ];

    const uniforms = [
        'uProjectionMatrix',
        'uModelViewMatrix',
        'uNormalMatrix',
        'uSampler',
        'uSampler2'
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

    texture = new Texture( gl );
    texture.setImage( '/common/images/webgl.png' );

    texture2 = new Texture( gl );
    texture2.setImage( '/common/images/light.png' );
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

            // Bind
            gl.bindVertexArray( object.vao );
            gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, object.ibo );

            // Activate textures
            if ( object.textureCoords ) {
                gl.activeTexture( gl.TEXTURE0 );
                gl.bindTexture( gl.TEXTURE_2D, texture.glTexture );
                gl.uniform1i( program.uSampler, 0 );

                gl.activeTexture( gl.TEXTURE1 );
                gl.bindTexture( gl.TEXTURE_2D, texture2.glTexture );
                gl.uniform1i( program.uSampler2, 1 );
            }

            // Draw
            gl.drawElements( gl.TRIANGLES, object.indices.length, gl.UNSIGNED_SHORT, 0 );

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
}

window.onload = init;
