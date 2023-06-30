#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

in vec4     vVertexColor;

out vec4    fragColor;

void main( void )
{
    fragColor = vVertexColor;
}