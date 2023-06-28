'use strict';

import * as glm from 'gl-matrix' ;

import utils from '../common/Utils.js';

/** 
 * @type { HTMLCanvasElement } 
 */
let canvas;
/** 
 * @type { WebGL2RenderingContext } 
 */
let gl;
/** 
 * @type { WebGLProgram } 
 */
let program;
/** 
 * @type { WebGLBuffer } 
 */
let squareVertexBuffer;
/** 
 * @type { WebGLBuffer } 
 */
let squareIndexBuffer;
/** 
 * @type { Array<number> } 
 */
let indices;
/**
 * @type { WebGLVertexArrayObject }
 */
let squareVAO;
/**
 * @type { string } 렌더링 모드 문자열
 */
let renderingMode = 'TRIANGLES';

let parts = [] ;
let modelTM = glm.mat4.create() ;
let viewTM = glm.mat4.create() ;
let projTM = glm.mat4.create() ;

/**
 * @type { string } 정점셰이더 코드
 */
const vertCode = 
`#version 300 es
#pragma vscode_glsllint_stage: vert

precision mediump float;

// uniform mat4 uModelMatrix ;
// uniform mat4 uViewMatrix ;
// uniform mat4 uModelViewMatrix ;
// uniform mat4 uProjectionMatrix ;

in vec3 aVertexPosition;

uniform mat4 uModelMatrix ;
uniform mat4 uViewMatrix ;
uniform mat4 uModelViewMatrix ;
uniform mat4 uProjectionMatrix ;

void main( void ) 
{
    gl_PointSize = 1.0;

    //gl_Position = vec4( aVertexPosition, 1.0 );
    //gl_Position = uProjectionMatrix * uModelViewMatrix * vec4( aVertexPosition, 1.0 );
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4( aVertexPosition, 1.0 );
}`;

/**
 * @type { string } 프레그먼드셰이더 코드
 */
const fragCode =
`#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

// Color that is the result of this shader
out vec4 fragColor;

void main( void ) 
{
    // Set the result as red
    fragColor = vec4( 1.0, 1.0, 0.0, 1.0 );
}`;

/**
 * 
 * @param {string} shaderCode Shader source code
 * @param {number} shaderType WebGL2RenderingContext.VERTEX_SHADER | WebGL2RenderingContext.FRAGMENT_SHADER
 * @returns {WebGLShader}
 */
function compileShader( shaderCode, shaderType )
{
    /** @type {WebGLShader} */
    let shader;
    if ( shaderType === gl.VERTEX_SHADER ) 
    {
        shader = gl.createShader( gl.VERTEX_SHADER );
    }
    else if ( shaderType === gl.FRAGMENT_SHADER ) 
    {
        shader = gl.createShader( gl.FRAGMENT_SHADER );
    }
    else 
    {
        return null;
    }

    // Compile the shader using the supplied shader code
    gl.shaderSource( shader, shaderCode );
    gl.compileShader( shader );

    // Ensure the shader is valid
    if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) 
    {
        console.error( gl.getShaderInfoLog( shader ) );
        return null;
    }

    return shader;
}

/**
 * Create a program with the appropriate vertex and fragment shaders
 * @param {string} vertCode 
 * @param {string} fragCode 
 */
function initProgram( vertCode, fragCode ) 
{
    const vertexShader   = compileShader( vertCode, gl.VERTEX_SHADER );
    const fragmentShader = compileShader( fragCode, gl.FRAGMENT_SHADER );

    program = gl.createProgram();
    gl.attachShader( program, vertexShader );
    gl.attachShader( program, fragmentShader );
    gl.linkProgram( program );

    if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) 
    {
        //console.error( 'Could not initialize shaders' );
        console.error( "[e] shader program error : " + gl.getProgramInfoLog( program ) ) ;
    }

    gl.useProgram( program );
    
    // We attach the location of these shader values to the program instance
    // for easy access later in the code
    program.aVertexPosition     = gl.getAttribLocation( program, 'aVertexPosition' );
    program.uModelMatrix        = gl.getUniformLocation( program, 'uModelMatrix' );
    program.uViewMatrix         = gl.getUniformLocation( program, 'uViewMatrix' );
    program.uModelViewMatrix    = gl.getUniformLocation( program, 'uModelViewMatrix' );
    program.uProjectionMatrix   = gl.getUniformLocation( program, 'uProjectionMatrix' );
}

function initModels()
{
    for ( let i = 1 ; i < 179 ; ++i )
    {
        fetch( `/common/models/nissan-gtr/part${i}.json` )
            .then( res => res.json() )
            .then( data => {

                const vao = gl.createVertexArray();
                gl.bindVertexArray( vao );

                const vbo = gl.createBuffer();
                gl.bindBuffer( gl.ARRAY_BUFFER, vbo );
                gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( data.vertices ), gl.STATIC_DRAW );

                gl.enableVertexAttribArray( program.aVertexPosition );
                gl.vertexAttribPointer( program.aVertexPosition, 3, gl.FLOAT, false, 0, 0 );

                const ibo = gl.createBuffer();
                gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, ibo );
                gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( data.indices ), gl.STATIC_DRAW );

                data.vao = vao ;
                data.ibo = ibo ;

                parts.push( data );

                gl.bindVertexArray( null );
                gl.bindBuffer( gl.ARRAY_BUFFER, null );
                gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
            } )
            .catch( console.error );
    }
}

// Set up the buffers for the square
function initBuffers() 
{
    const vertices = [
        -0.5, -0.5, 0,
        -0.25, 0.5, 0,
        0.0, -0.5, 0,
        0.25, 0.5, 0,
        0.5, -0.5, 0
    ];

    indices = [ 0, 1, 2, 0, 2, 3, 2, 3, 4 ];

    // Create VAO instance
    squareVAO = gl.createVertexArray();

    // Bind it so we can work on it
    gl.bindVertexArray( squareVAO );

    const squareVertexBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, squareVertexBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW );

    // Provide instructions for VAO to use data later in draw
    gl.enableVertexAttribArray( program.aVertexPosition );
    gl.vertexAttribPointer( program.aVertexPosition, 3, gl.FLOAT, false, 0, 0 );

    // Setting up the IBO
    squareIndexBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( indices ), gl.STATIC_DRAW );

    // Clean
    gl.bindVertexArray( null ) ;
    gl.bindBuffer( gl.ARRAY_BUFFER, null );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
}

function initControls()
{
    utils.configureControls( {
        '렌더링 모드': {
            value: renderingMode,
            options: [
                'TRIANGLES',
                'LINES',
                'POINTS',
                'LINE_LOOP',
                'LINE_STRIP',
                'TRIANGLE_STRIP',
                'TRIANGLE_FAN'
            ],
            onChange: ( v ) => {
                renderingMode = v ;
                //console.log( '렌더링 모드 : ' + renderingMode );
                draw();
            }
        }
    } );
}

// We call draw to render to our canvas
function draw() 
{
    // Clear the scene
    gl.viewport( 0, 0, gl.canvas.width, gl.canvas.height );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );


    glm.mat4.perspective( projTM, 45 * ( Math.PI / 180 ), gl.canvas.width / gl.canvas.height, 0.1, 3000 );
    gl.uniformMatrix4fv( program.uProjectionMatrix, false, projTM );
    
    glm.mat4.identity( viewTM );
    glm.mat4.lookAt( viewTM, [0, 30, 100], [0,0,0], [0,1,0] ); // 카메라 월드행렬의 역행렬
    //glm.mat4.targetTo( viewTM, [0, 30, 100], [0,0,0], [0,1,0] ); // 월드행렬
    //glm.mat4.invert( viewTM, viewTM ); // 역행렬 사용해야 맞다
    
    glm.mat4.identity( modelTM );
    glm.mat4.translate( modelTM, modelTM, [ -40, 0, -100 ] );

    glm.mat4.mul( modelTM, modelTM, viewTM );
    gl.uniformMatrix4fv( program.uModelViewMatrix, false, modelTM );

    parts.forEach( ( part ) => {
        gl.bindVertexArray( part.vao );
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, part.ibo );

        gl.drawElements( gl.LINES, part.indices.length, gl.UNSIGNED_SHORT, 0 );

        gl.bindVertexArray( null );
        gl.bindBuffer( gl.ARRAY_BUFFER, null );
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
    } );

    glm.mat4.identity( viewTM );
    glm.mat4.lookAt( viewTM, [0, 30, 100], [0,0,0], [0,1,0] );

    glm.mat4.identity( modelTM );
    glm.mat4.translate( modelTM, modelTM, [ 50, 0, -100 ] );

    glm.mat4.mul( modelTM, modelTM, viewTM );
    gl.uniformMatrix4fv( program.uModelViewMatrix, false, modelTM );

    parts.forEach( ( part ) => {
        gl.bindVertexArray( part.vao );
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, part.ibo );

        //gl.drawElements( gl.LINES, part.indices.length, gl.UNSIGNED_SHORT, 0 );
        //gl.drawElements( gl.TRIANGLES, part.indices.length, gl.UNSIGNED_SHORT, 0 );
        gl.drawElements( gl.POINTS, part.indices.length, gl.UNSIGNED_SHORT, 0 );

        gl.bindVertexArray( null );
        gl.bindBuffer( gl.ARRAY_BUFFER, null );
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
    } );

}

function drawModelViewProjection() 
{
    // Clear the scene
    gl.viewport( 0, 0, gl.canvas.width, gl.canvas.height );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    glm.mat4.perspective( projTM, 45 * ( Math.PI / 180 ), gl.canvas.width / gl.canvas.height, 0.1, 3000 );
    gl.uniformMatrix4fv( program.uProjectionMatrix, false, projTM );
    
    glm.mat4.identity( viewTM );
    glm.mat4.lookAt( viewTM, [0, 100, 120], [0,0,0], [0,1,0] ); // 카메라 월드행렬의 역행렬
    //glm.mat4.targetTo( viewTM, [0, 30, 100], [0,0,0], [0,1,0] ); // 월드행렬
    //glm.mat4.invert( viewTM, viewTM ); // 역행렬 사용해야 맞다
    gl.uniformMatrix4fv( program.uViewMatrix, false, viewTM );
    
    glm.mat4.identity( modelTM );
    glm.mat4.translate( modelTM, modelTM, [ -40, 0, 0 ] );
    gl.uniformMatrix4fv( program.uModelMatrix, false, modelTM );

    parts.forEach( ( part ) => {
        gl.bindVertexArray( part.vao );
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, part.ibo );

        gl.drawElements( gl.LINES, part.indices.length, gl.UNSIGNED_SHORT, 0 );

        gl.bindVertexArray( null );
        gl.bindBuffer( gl.ARRAY_BUFFER, null );
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
    } );

    glm.mat4.identity( modelTM );
    glm.mat4.translate( modelTM, modelTM, [ 50, 0, 0 ] );
    gl.uniformMatrix4fv( program.uModelMatrix, false, modelTM );

    parts.forEach( ( part ) => {
        gl.bindVertexArray( part.vao );
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, part.ibo );

        gl.drawElements( gl.LINES, part.indices.length, gl.UNSIGNED_SHORT, 0 );
        //gl.drawElements( gl.TRIANGLES, part.indices.length, gl.UNSIGNED_SHORT, 0 );
        //gl.drawElements( gl.POINTS, part.indices.length, gl.UNSIGNED_SHORT, 0 );

        gl.bindVertexArray( null );
        gl.bindBuffer( gl.ARRAY_BUFFER, null );
        gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
    } );

}

function render()
{
    requestAnimationFrame( render );

    //draw();
    drawModelViewProjection();
}

// Entry point to our application
function init() 
{
    // Retrieve the canvas
    canvas = utils.getCanvas( 'webgl-canvas' );

    // Set the canvas to the size of the screen
    canvas.width  = window.innerWidth ;
    canvas.height = window.innerHeight * 0.9 ;

    // Retrieve a WebGL context
    gl = utils.getGLContext( canvas );
    // Set the clear color to be black
    gl.clearColor( 0.2, 0.2, 0.2, 1.0 );

    // Call the functions in an appropriate order
    initProgram( vertCode, fragCode );
    //initBuffers();
    initModels();
    initControls();
    //draw();
    render();
}

// Call init once the webpage has loaded
window.onload = init;

