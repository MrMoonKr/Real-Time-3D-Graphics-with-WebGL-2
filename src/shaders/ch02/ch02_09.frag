#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

// Color that is the result of this shader
out vec4 fragColor;

void main( void ) 
{
    // Set the result as red
    fragColor = vec4( 1.0, 1.0, 0.0, 1.0 );
}