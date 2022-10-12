'use strict';

import { vec3, mat4 } from 'gl-matrix';

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

import utils from './common/Utils.js' ;
import Clock from './common/Clock.js' ;
import Program from './common/Program.js';
import Scene from './common/Scene.js' ;
import Floor from './common/Floor.js' ;
import Axis from './common/Axis.js' ;
import Camera from './common/Camera.js';
import Controls from './common/Controls.js';
import Picker from './common/Picker.js';
import Transforms from './common/Transforms.js' ;



let gl, clock, program, camera, transforms, controls, scene,
    picker, showPickingImage = false;

function configure() 
{
    const canvas = utils.getCanvas( 'webgl-canvas' );
    utils.autoResizeCanvas( canvas );

    gl = utils.getGLContext( canvas );
    gl.clearColor( 0.9, 0.9, 0.9, 1 );
    gl.clearDepth( 100 );
    gl.enable( gl.DEPTH_TEST );
    gl.depthFunc( gl.LESS );
    gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

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
        'uOffscreen',
        'uPickingColor'
    ];

    program.load( attributes, uniforms );

    clock = new Clock();
    scene = new Scene( gl, program );

    // Create picker
    picker = new Picker( canvas, gl, {
        hitPropertyCallback: hitProperty,
        addHitCallback: addHit,
        removeHitCallback: removeHit,
        processHitsCallback: processHits,
        moveCallback: movePickedObjects
    } );

    camera = new Camera( Camera.ORBITING_TYPE );
    camera.goHome( [ 0, 0, 192 ] );
    camera.setFocus( [ 0, 0, 0 ] );
    camera.setElevation( -22 );
    camera.setAzimuth( 37 );
    controls = new Controls( camera, canvas );
    // Set picker
    controls.setPicker( picker );

    transforms = new Transforms( gl, program, camera, canvas );

    gl.uniform3fv( program.uLightPosition, [ 0, 5, 20 ] );
    gl.uniform4fv( program.uLightAmbient, [ 0, 0, 0, 1 ] );
    gl.uniform4fv( program.uLightDiffuse, [ 1, 1, 1, 1 ] );
}

function positionGenerator() 
{
    const
        flagX = Math.floor( Math.random() * 10 ),
        flagZ = Math.floor( Math.random() * 10 );

    let x = Math.floor( Math.random() * 60 ),
        z = Math.floor( Math.random() * 60 );

    if ( flagX >= 5 ) {
        x = -x;
    }
    if ( flagZ >= 5 ) {
        z = -z;
    }

    return [ x, 0, z ];
}

const colorset = {};

function objectLabelGenerator() 
{
    const
        color = [ Math.random(), Math.random(), Math.random(), 1 ],
        key = color.toString();

    if ( key in colorset ) {
        return objectLabelGenerator();
    } else {
        colorset[ key ] = true;
        return color;
    }
}

function diffuseColorGenerator( index ) 
{
    const color = ( index % 30 / 60 ) + 0.2;
    return [ color, color, color, 1 ];
}

function scaleGenerator() 
{
    const scale = Math.random() + 0.3;
    return [ scale, scale, scale ];
}

function load() 
{
    scene.add( new Floor( 80, 20 ) );

    for ( let i = 0; i < 100; i++ ) {
        const objectType = Math.floor( Math.random() * 2 );

        const options = {
            position: positionGenerator(),
            scale: scaleGenerator(),
            diffuse: diffuseColorGenerator( i ),
            pickingColor: objectLabelGenerator()
        };

        switch ( objectType ) {
            case 1:
                scene.load( '/common/models/geometries/sphere1.json', `ball_${ i }`, options );
                break;
            case 0:
                scene.load( '/common/models/geometries/cylinder.json', `cylinder_${ i }`, options );
                break;
        }
    }
}

function hitProperty( obj ) {
    return obj.pickingColor;
}

function addHit( obj ) {
    obj.previous = obj.diffuse.slice( 0 );
    obj.diffuse = obj.pickingColor;
}

function removeHit( obj ) {
    obj.diffuse = obj.previous.slice( 0 );
}

function processHits( hits ) {
    hits.forEach( hit => hit.diffuse = hit.previous );
}

function movePickedObjects( dx, dy ) {
    const hits = picker.getHits();

    if ( !hits ) return;

    // Can change factor to be dynamic on screen size
    // or hard-coded for a particular interaction
    const factor = Math.max(
        Math.max( camera.position[ 0 ], camera.position[ 1 ] ), camera.position[ 2 ]
    ) / 2000;

    hits.forEach( hit => {
        const scaleX = vec3.create();
        const scaleY = vec3.create();

        if ( controls.alt ) {
            vec3.scale( scaleY, camera.normal, dy * factor );
        } else {
            vec3.scale( scaleY, camera.up, -dy * factor );
            vec3.scale( scaleX, camera.right, dx * factor );
        }

        vec3.add( hit.position, hit.position, scaleY );
        vec3.add( hit.position, hit.position, scaleX );
    } );
}

function render() {
    // Off-screen rendering
    gl.bindFramebuffer( gl.FRAMEBUFFER, picker.framebuffer );
    gl.uniform1i( program.uOffscreen, true );
    draw();

    // On-screen rendering
    gl.uniform1i( program.uOffscreen, showPickingImage );
    gl.bindFramebuffer( gl.FRAMEBUFFER, null );
    draw();
}

function draw() {
    gl.viewport( 0, 0, gl.canvas.width, gl.canvas.height );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    transforms.updatePerspective();

    try {
        const offscreen = program.getUniform( program.uOffscreen );
        const flatShadingMode = showPickingImage || offscreen;

        scene.traverse( object => {
            if ( object.alias === 'floor' && flatShadingMode ) {
                return;
            }

            transforms.calculateModelView();
            transforms.push();

            if ( object.alias !== 'floor' ) {
                mat4.translate( transforms.modelViewMatrix, transforms.modelViewMatrix, object.position );
                mat4.scale( transforms.modelViewMatrix, transforms.modelViewMatrix, object.scale );
            }

            transforms.setMatrixUniforms();
            transforms.pop();

            if ( object.diffuse[ 3 ] < 1 && !offscreen ) {
                gl.disable( gl.DEPTH_TEST );
                gl.enable( gl.BLEND );
            } else {
                gl.enable( gl.DEPTH_TEST );
                gl.disable( gl.BLEND );
            }

            gl.uniform4fv( program.uMaterialDiffuse, object.diffuse );
            gl.uniform4fv( program.uMaterialAmbient, object.ambient );
            gl.uniform1i( program.uWireframe, object.wireframe );
            // Default picking color if none exists
            gl.uniform4fv( program.uPickingColor, object.pickingColor || [ 0, 0, 0, 0 ] );
            gl.uniform1i( program.uOffscreen, flatShadingMode );

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
    clock.on( 'tick', render );

    initControls();
}

window.onload = init;

function initControls() {
    utils.configureControls( {
        'Show Picking Image': {
            value: showPickingImage,
            onChange: v => showPickingImage = v
        },
        'Reset Scene': () => {
            scene.objects = [];
            load();
            camera.goHome();
            camera.setElevation( -40 );
            camera.setAzimuth( -30 );
        }
    } );
}