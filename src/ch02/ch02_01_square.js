'use strict';

import utils from '../common/Utils.js' ;

import * as SPECTOR from 'spectorjs';

/**
 * @type {HTMLCanvasElement} 캔버스 요소
 */
let canvas ;
/**
 * @type {WebGL2RenderingContext} gl 컨텍스트
 */
let gl ;
/**
 * @type {WebGLProgram} 셰이더 프로그램
 */
let program ;
/**
 * @type {WebGLBuffer} 위치용 VBO
 */
let squarePositionVBO ;
/**
 * @type {WebGLBuffer} 인덱스용 VBO
 */
let squareIndexVBO ;

/**
 * @type {number[]} 정점의 위치 데이터
 */
let vertices = [] ;
/**
 * @type {number[]} 인덱스 데이터
 */
let indices = [] ;

let vertCode = `#version 300 es
    #pragma vscode_glsllint_stage : vert

    precision mediump float;

    // Supplied vertex position attribute
    in vec3 aVertexPosition;

    void main(void) {
        // Set the position in clipspace coordinates
        gl_Position = vec4( aVertexPosition, 1.0 );
    }
`;

let fragCode = `#version 300 es
    #pragma vscode_glsllint_stage : frag

    precision mediump float;

    // Color that is the result of this shader
    out vec4 fragColor;

    void main(void) {
    // Set the result as red
    fragColor = vec4(1.0, 0.0, 0.0, 1.0);
    }
`;


/**
 * 
 * @param {string} shaderCode 셰이더 코드
 * @param {number} shaderType gl.VERTEX_SHADER | gl.FRAGMENT_SHADER
 * @returns 
 */
function getShaderFromCode( shaderCode, shaderType ) {

    /**
     * @type {WebGLShader}
     */
    let shader;
    if ( shaderType ==  gl.VERTEX_SHADER ) {
        shader = gl.createShader( gl.VERTEX_SHADER );
    } else if ( shaderType == gl.FRAGMENT_SHADER ) {
        shader = gl.createShader( gl.FRAGMENT_SHADER );
    } else {
        console.error( 'Unknown ShaderType' ) ;
        return null;
    }

    gl.shaderSource( shader, shaderCode );
    gl.compileShader( shader );

    if ( !gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ) {
        console.error( gl.getShaderInfoLog( shader ) );
        return null;
    }

    return shader;
}

/**
 * 셰이더 프로그램 생성 및 Attribute Location 조회
 */
function initProgram() {

    const vertexShader      = getShaderFromCode( vertCode, gl.VERTEX_SHADER );
    const fragmentShader    = getShaderFromCode( fragCode, gl.FRAGMENT_SHADER );
    console.log( vertexShader ) ;

    program = gl.createProgram();

    gl.attachShader( program, vertexShader );
    gl.attachShader( program, fragmentShader );
    gl.linkProgram( program );

    if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) {
        console.error( 'Could not initialize shaders' );
    }

    gl.useProgram( program );

    program.aVertexPosition = gl.getAttribLocation( program, 'aVertexPosition' );
}

/**
 * 지오메트리용 버퍼 생성
 */
function initBuffers() {
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
    vertices = [
        -0.5, 0.5, 0,
        -0.5, -0.5, 0,
        0.5, -0.5, 0,
        0.5, 0.5, 0
    ];

    indices = [ 0, 1, 2, 0, 2, 3 ];

    squarePositionVBO = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, squarePositionVBO );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( vertices ), gl.STATIC_DRAW );

    squareIndexVBO = gl.createBuffer();
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, squareIndexVBO );
    gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( indices ), gl.STATIC_DRAW );

    gl.bindBuffer( gl.ARRAY_BUFFER, null );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
}

// We call draw to render to our canvas
function draw() {
 
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    gl.viewport( 0, 0, gl.canvas.width, gl.canvas.height );

    gl.bindBuffer( gl.ARRAY_BUFFER, squarePositionVBO );
    gl.vertexAttribPointer( program.aVertexPosition, 3, gl.FLOAT, false, 0, 0 );
    gl.enableVertexAttribArray( program.aVertexPosition );

    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, squareIndexVBO );

    gl.drawElements( gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0 );

    gl.bindBuffer( gl.ARRAY_BUFFER, null );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
}

// Entry point to our application
function init() {

    canvas = utils.getCanvas( 'webgl-canvas' );

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.9;

    const spector = new SPECTOR.Spector();
    spector.displayUI();

    gl = utils.getGLContext( canvas );
    gl.clearColor( 0.3, 0.3, 0.3, 1 );

    initProgram();
    initBuffers();
    draw();
}


window.onload = init;

