#version 300 es
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
}