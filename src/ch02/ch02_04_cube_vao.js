'use strict';

import { mat4 } from 'gl-matrix';
import utils from '../common/Utils.js' ;
import FileLoader from '../common/FileLoader.js';
import PLYLoader from '../common/PLYLoader.js';


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
 * @type {WebGLVertexArrayObject} 메시용 VAO
 */
let cubeVAO ;
/**
 * @type {WebGLBuffer} 메시 정점용 VBO
 */
let cubeVBO ;
/**
 * @type {WebGLBuffer} 인덱스용 VBO
 */
let cubeIBO ;

/**
 * @type {number[]} 정점 데이터
 */
let cubeVertices = [
    // float4 position, float4 color, float2 uv,
    1, -1, 1, 1,    1, 0, 1, 1,     0, 1,
    -1, -1, 1, 1,   0, 0, 1, 1,     1, 1,
    -1, -1, -1, 1,  0, 0, 0, 1,     1, 0,
    1, -1, -1, 1,   1, 0, 0, 1,     0, 0,
    1, -1, 1, 1,    1, 0, 1, 1,     0, 1,
    -1, -1, -1, 1,  0, 0, 0, 1,     1, 0,

    1, 1, 1, 1,     1, 1, 1, 1,     0, 1,
    1, -1, 1, 1,    1, 0, 1, 1,     1, 1,
    1, -1, -1, 1,   1, 0, 0, 1,     1, 0,
    1, 1, -1, 1,    1, 1, 0, 1,     0, 0,
    1, 1, 1, 1,     1, 1, 1, 1,     0, 1,
    1, -1, -1, 1,   1, 0, 0, 1,     1, 0,

    -1, 1, 1, 1,    0, 1, 1, 1,     0, 1,
    1, 1, 1, 1,     1, 1, 1, 1,     1, 1,
    1, 1, -1, 1,    1, 1, 0, 1,     1, 0,
    -1, 1, -1, 1,   0, 1, 0, 1,     0, 0,
    -1, 1, 1, 1,    0, 1, 1, 1,     0, 1,
    1, 1, -1, 1,    1, 1, 0, 1,     1, 0,

    -1, -1, 1, 1,   0, 0, 1, 1,     0, 1,
    -1, 1, 1, 1,    0, 1, 1, 1,     1, 1,
    -1, 1, -1, 1,   0, 1, 0, 1,     1, 0,
    -1, -1, -1, 1,  0, 0, 0, 1,     0, 0,
    -1, -1, 1, 1,   0, 0, 1, 1,     0, 1,
    -1, 1, -1, 1,   0, 1, 0, 1,     1, 0,

    1, 1, 1, 1,     1, 1, 1, 1,     0, 1,
    -1, 1, 1, 1,    0, 1, 1, 1,     1, 1,
    -1, -1, 1, 1,   0, 0, 1, 1,     1, 0,
    -1, -1, 1, 1,   0, 0, 1, 1,     1, 0,
    1, -1, 1, 1,    1, 0, 1, 1,     0, 0,
    1, 1, 1, 1,     1, 1, 1, 1,     0, 1,

    1, -1, -1, 1,   1, 0, 0, 1,     0, 1,
    -1, -1, -1, 1,  0, 0, 0, 1,     1, 1,
    -1, 1, -1, 1,   0, 1, 0, 1,     1, 0,
    1, 1, -1, 1,    1, 1, 0, 1,     0, 0,
    1, -1, -1, 1,   1, 0, 0, 1,     0, 1,
    -1, 1, -1, 1,   0, 1, 0, 1,     1, 0,
];
/**
 * @type {number[]} 인덱스 데이터
 */
let indices = [] ;

/**
 * @type {mat4} 메시의 월드 변환 행렬
 */
let modelMatrix = mat4.create() ;
/**
 * @type {mat4} 카메라의 월드 변환 행렬의 역행렬
 */
let viewMatirx = mat4.create() ;
/**
 * @type {mat4} 카메라의 투영행렬
 */
let projectionMatrix = mat4.create() ;

let angle = 0 ;

let vertCode = `#version 300 es
    #pragma vscode_glsllint_stage : vert

    precision mediump float ;

    in vec3         aVertexPosition ;
    in vec4         aVertexColor ;
    in vec2         aVertexUV ;

    uniform mat4    uModelMatrix ;
    uniform mat4    uViewMatrix ;
    uniform mat4    uProjectionMatrix ;

    out vec4        vWorldPosition ;
    out vec4        vVertexColor ;

    void main(void) {

        vWorldPosition  = normalize( uModelMatrix * vec4( aVertexPosition, 1.0 ) ) ;
        vVertexColor    = aVertexColor ;

        gl_PointSize    = 3.0 ;
        gl_Position     = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4( aVertexPosition, 1.0 );
        
    }
`;

let fragCode = `#version 300 es
    #pragma vscode_glsllint_stage : frag

    precision mediump float ;

    in vec4         vWorldPosition ;
    in vec4         vVertexColor ;
    out vec4        fragColor ;

    void main(void) {

        //fragColor = vec4( 0.5, 0.9, 0.2, 1.0 );
        //fragColor = vec4( vWorldPosition.xyz, 1.0 );
        fragColor   = vec4( vVertexColor.xyz, 1.0 );
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

    program.aVertexPosition     = gl.getAttribLocation( program, 'aVertexPosition' );
    program.aVertexColor        = gl.getAttribLocation( program, 'aVertexColor' );

    program.uModelMatrix        = gl.getUniformLocation( program, 'uModelMatrix' );
    program.uViewMatrix         = gl.getUniformLocation( program, 'uViewMatrix' );
    program.uProjectionMatrix   = gl.getUniformLocation( program, 'uProjectionMatrix' );
}

/**
 * 지오메트리용 버퍼 생성
 */
function initBuffers() {

    indices = [ 
        0, 1, 2,
        0, 2, 3,
        0, 3, 4,
        0, 4, 5,
        0, 5, 6,
        0, 6, 7,
        0, 7, 8,
        0, 8, 9,
        0, 9, 10,
        0, 10, 1
    ];

    cubeVAO = gl.createVertexArray();
    gl.bindVertexArray( cubeVAO );

    cubeVBO = gl.createBuffer();
    gl.bindBuffer( gl.ARRAY_BUFFER, cubeVBO );
    gl.bufferData( gl.ARRAY_BUFFER, new Float32Array( cubeVertices ), gl.STATIC_DRAW );

    gl.enableVertexAttribArray( program.aVertexPosition );
    gl.vertexAttribPointer( program.aVertexPosition, 3, gl.FLOAT, false, 4*4 + 4*4 + 4*2 , 0 );
    
    gl.enableVertexAttribArray( program.aVertexColor );
    gl.vertexAttribPointer( program.aVertexColor, 4, gl.FLOAT, false, 4*4 + 4*4 + 4*2 , 4*4 );

    //cubeIBO = gl.createBuffer();
    //gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, cubeIBO );
    //gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, new Uint16Array( indices ), gl.STATIC_DRAW );

    gl.bindVertexArray( null );
    gl.bindBuffer( gl.ARRAY_BUFFER, null );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );
}


// We call draw to render to our canvas
function draw() {

    angle += 1 ;
 
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );
    gl.viewport( 0, 0, gl.canvas.width, gl.canvas.height );

    gl.cullFace( gl.BACK );
    gl.enable( gl.CULL_FACE );

    mat4.perspective( projectionMatrix, 45 * Math.PI / 180, gl.canvas.width / gl.canvas.height, 0.1, 10000.0 );

    mat4.lookAt( viewMatirx, [ 0, 3, 10 ], [ 0, 0, 0 ], [ 0, 1, 0 ] );

    mat4.identity( modelMatrix );
    //mat4.rotate( modelMatrix, modelMatrix, angle * Math.PI / 180, [ 0, 1, 0 ] );
    //mat4.translate( modelMatrix, modelMatrix, [ 0, 0, -10 ] );
    mat4.rotate( modelMatrix, modelMatrix, angle * Math.PI / 180, [ 0, 1, 0 ] );
    mat4.rotate( modelMatrix, modelMatrix, angle * Math.PI / 180, [ 0, 0, 1 ] );

    gl.uniformMatrix4fv( program.uProjectionMatrix, false, projectionMatrix );
    gl.uniformMatrix4fv( program.uViewMatrix, false, viewMatirx );
    gl.uniformMatrix4fv( program.uModelMatrix, false, modelMatrix );

    gl.bindVertexArray( cubeVAO ) ;
    //gl.drawElements( gl.LINE_LOOP, indices.length, gl.UNSIGNED_SHORT, 0 );
    //gl.drawArrays( gl.TRIANGLES, 0, cubeVertices.length / ( 4*4 + 4*4 + 4*2 ) );
    gl.drawArrays( gl.TRIANGLES, 0, cubeVertices.length );

    gl.bindVertexArray( null );
    gl.bindBuffer( gl.ARRAY_BUFFER, null );
    gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, null );

    requestAnimationFrame( draw ); // 호출요청으로 반복호출 효과
}

// Entry point to our application
function init() {

    canvas = utils.getCanvas( 'webgl-canvas' );

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight * 0.9;

    gl = utils.getGLContext( canvas );
    gl.clearColor( 0.3, 0.3, 0.3, 1 );

    initProgram();
    initBuffers();

    draw();
}


window.onload = init;

