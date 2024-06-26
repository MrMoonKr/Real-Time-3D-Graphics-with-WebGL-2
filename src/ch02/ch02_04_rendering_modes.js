'use strict';

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

/**
 * @type { string } 정점셰이더 코드
 */
const vertCode = 
`#version 300 es
#pragma vscode_glsllint_stage: vert

precision mediump float;

// Supplied vertex position attribute
in vec3 aVertexPosition;

void main( void ) 
{
    gl_PointSize = 30.0;
    // Set the position in clipspace coordinates
    gl_Position = vec4( aVertexPosition, 1.0 );
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

    // Bind the VAO
    gl.bindVertexArray( squareVAO );

            // Depending on the rendering mode type, we will draw differently
            switch ( renderingMode )
            {
                case 'TRIANGLES': {
                    indices = [ 0, 1, 2, 2, 3, 4 ];
                    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( indices ), gl.STATIC_DRAW );
                    gl.drawElements( gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0 );
                    break;
                }
                case 'LINES': {
                    indices = [ 1, 3, 0, 4, 1, 2, 2, 3 ];
                    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( indices ), gl.STATIC_DRAW );
                    gl.drawElements( gl.LINES, indices.length, gl.UNSIGNED_SHORT, 0 );
                    break;
                }
                case 'POINTS': {
                    indices = [ 1, 2, 3 ];
                    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( indices ), gl.STATIC_DRAW );
                    gl.drawElements( gl.POINTS, indices.length, gl.UNSIGNED_SHORT, 0 );
                    break;
                }
                case 'LINE_LOOP': {
                    indices = [ 2, 3, 4, 1, 0 ];
                    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( indices ), gl.STATIC_DRAW );
                    gl.drawElements( gl.LINE_LOOP, indices.length, gl.UNSIGNED_SHORT, 0 );
                    break;
                }
                case 'LINE_STRIP': {
                    indices = [ 2, 3, 4, 1, 0 ];
                    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( indices ), gl.STATIC_DRAW );
                    gl.drawElements( gl.LINE_STRIP, indices.length, gl.UNSIGNED_SHORT, 0 );
                    break;
                }
                case 'TRIANGLE_STRIP': {
                    indices = [ 0, 1, 2, 3, 4 ];
                    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( indices ), gl.STATIC_DRAW );
                    gl.drawElements( gl.TRIANGLE_STRIP, indices.length, gl.UNSIGNED_SHORT, 0 );
                    break;
                }
                case 'TRIANGLE_FAN': {
                    indices = [ 0, 1, 2, 3, 4 ];
                    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( indices ), gl.STATIC_DRAW );
                    gl.drawElements( gl.TRIANGLE_FAN, indices.length, gl.UNSIGNED_SHORT, 0 );
                    break;
                }
            }

    // Clean
    gl.bindVertexArray( null );
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
    initControls();
    draw();
}

// Call init once the webpage has loaded
window.onload = init;

