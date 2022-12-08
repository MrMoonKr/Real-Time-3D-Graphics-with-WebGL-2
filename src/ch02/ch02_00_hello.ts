//'use strict';
// @ts-nocheck

import utils from '../common/Utils.js';

let canvas: HTMLCanvasElement ;
let gl: WebGL2RenderingContext ;
let program: WebGLProgram ;
let squareVertexBuffer: WebGLBuffer ;
let squareIndexBuffer: WebGLBuffer ;
let indices: Array<number>;

function getShader( id: string ): WebGLShader
{
    const script = document.getElementById( id ) as HTMLScriptElement ;
    const shaderString = script.text.trim();

    // Assign shader depending on the type of shader
    let shader: WebGLShader;
    if ( script.type === 'x-shader/x-vertex' ) 
    {
        shader = gl.createShader( gl.VERTEX_SHADER );
    }
    else if ( script.type === 'x-shader/x-fragment' ) 
    {
        shader = gl.createShader( gl.FRAGMENT_SHADER );
    }
    else 
    {
        return null;
    }

    // Compile the shader using the supplied shader code
    gl.shaderSource( shader, shaderString );
    gl.compileShader( shader );

    // Ensure the shader is valid
    if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) 
    {
        console.error( gl.getShaderInfoLog( shader ) );
        return null;
    }

    return shader;
}

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
}
`;

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
}
`;

/**
 * 
 * @param shaderCode Shader source code
 * @param shaderType WebGL2RenderingContext.VERTEX_SHADER | WebGL2RenderingContext.FRAGMENT_SHADER
 * @returns 
 */
function compileShader( shaderCode: string, shaderType: number ): WebGLShader
{
    let shader: WebGLShader;
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

// Create a program with the appropriate vertex and fragment shaders
function initProgram( vertCode: string, fragCode: string ) 
{
    //const vertexShader   = getShader( 'vertex-shader' );
    //const fragmentShader = getShader( 'fragment-shader' );
    const vertexShader   = compileShader( vertCode, gl.VERTEX_SHADER );
    const fragmentShader = compileShader( fragCode, gl.FRAGMENT_SHADER );
    // Create a program
    program = gl.createProgram();
    // Attach the shaders to this program
    gl.attachShader( program, vertexShader );
    gl.attachShader( program, fragmentShader );
    gl.linkProgram( program );

    if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) 
    {
        //console.error( 'Could not initialize shaders' );
        console.error( "[e] shader program error : " + gl.getProgramInfoLog( program ) ) ;
    }

    // Use this program instance
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
        -0.5,  0.5, 0,
        -0.5, -0.5, 0,
         0.5, -0.5, 0,
         0.5,  0.5, 0
    ];

    // Indices defined in counter-clockwise order
    indices = [0, 1, 2, 0, 2, 3];

    // Setting up the VBO
    squareVertexBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, squareVertexBuffer );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW );

    // Setting up the IBO
    squareIndexBuffer = gl.createBuffer();
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( indices ), gl.STATIC_DRAW );

    // Clean
    gl.bindBuffer( gl.ARRAY_BUFFER, null );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
}

// We call draw to render to our canvas
function draw() 
{
    // Clear the scene
    gl.viewport( 0, 0, gl.canvas.width, gl.canvas.height );
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

    // Use the buffers we've constructed
    gl.bindBuffer( gl.ARRAY_BUFFER, squareVertexBuffer );
    gl.vertexAttribPointer( program.aVertexPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( program.aVertexPosition );

    // Bind IBO
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, squareIndexBuffer );

    // Draw to the scene using triangle primitives
    gl.drawElements( gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0 );

    // Clean
    gl.bindBuffer( gl.ARRAY_BUFFER, null );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
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

