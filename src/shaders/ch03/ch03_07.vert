#version 300 es
#pragma vscode_glsllint_stage: vert

precision mediump float;

uniform mat4    uModelViewMatrix ;
uniform mat4    uProjectionMatrix ;
uniform mat4    uNormalMatrix ;

uniform vec3    uLightPosition ;
//uniform vec3    uLightDiffuse ;
//uniform vec3    uMaterialDiffuse ;

in vec3         aVertexPosition ;
in vec3         aVertexNormal ;

out vec3        vNormal ;
out vec3        vLightRay ;
out vec3        vEyeVector ;

void main( void ) 
{
    vec4 vertex = uModelViewMatrix * vec4( aVertexPosition, 1.0 ) ;
    vec4 light  = uModelViewMatrix * vec4( uLightPosition, 1.0 ) ;

    vNormal     = vec3( uNormalMatrix * vec4( aVertexNormal, 1.0 ) ) ;

    vLightRay   = vertex.xyz - light.xyz ;
    vEyeVector  = -vec3( vertex.xyz ) ;

    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4( aVertexPosition, 1.0 );

}