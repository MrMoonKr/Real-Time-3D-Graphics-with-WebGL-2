'use strict';

import utils from '../common/Utils.js';

/** @type { HTMLCanvasElement } */
let canvas;
/** @type { WebGL2RenderingContext } */
let gl;
/** @type { WebGLProgram } */
let program;
/** @type { WebGLBuffer } */
let squareVertexBuffer;
/** @type { WebGLBuffer } */
let squareIndexBuffer;
/** @type { Array<number> } */
let indices;
/** @type { WebGLVertexArrayObject } */
let squareVAO;

/** @type { string } */
const vertCode = 
`#version 300 es
#pragma vscode_glsllint_stage: vert

precision mediump float;

// Supplied vertex position attribute
in vec3 aVertexPosition;

void main( void ) 
{
    // Set the position in clipspace coordinates
    gl_Position = vec4( aVertexPosition, 1.0 );
}`;

const fragCode =
`#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

// Color that is the result of this shader
out vec4 fragColor;

void main( void ) 
{
    // Set the result as red
    fragColor = vec4( 1.0, 0.0, 0.0, 1.0 );
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
    program.aVertexPosition = gl.getAttribLocation( program, 'aVertexPosition' );
}

// Set up the buffers for the square
function initBuffers() 
{
    /*
      V0                    V3
      (-0.5, 0.5, 0)        (0.5, 0.5, 0)
      X---------------------X
      |                     |
      |                     |
      |       (0, 0)        |
      |                     |
      |                     |
      X---------------------X
      V1                    V2
      (-0.5, -0.5, 0)       (0.5, -0.5, 0)
    */
    const vertices = [
        // first triangle (V0, V1, V2)
        -0.5,  0.5, 0,
        -0.5, -0.5, 0,
         0.5, -0.5, 0,

        // second triangle (V0, V2, V3)
        -0.5,  0.5, 0,
         0.5, -0.5, 0,
         0.5,  0.5, 0
    ];

    // 정점버퍼 생성
    squareVertexBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, squareVertexBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW );

    // Clean
    gl.bindBuffer( gl.ARRAY_BUFFER, null );
}

// We call draw to render to our canvas
function draw() 
{
    // Clear the scene
    gl.viewport( 0, 0, gl.canvas.width, gl.canvas.height );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    gl.bindBuffer( gl.ARRAY_BUFFER, squareVertexBuffer );
    gl.vertexAttribPointer( program.aVertexPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( program.aVertexPosition );

    gl.drawArrays( gl.TRIANGLES, 0, 6 );

    // Clean
    gl.bindBuffer( gl.ARRAY_BUFFER, null );
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
    initBuffers();
    draw();
}

// Call init once the webpage has loaded
window.onload = init;

