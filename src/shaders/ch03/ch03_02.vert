#version 300 es
#pragma vscode_glsllint_stage: vert

precision mediump float;

uniform mat4    uModelMatrix ;
uniform mat4    uCameraMatrix ;
uniform mat4    uViewMatrix ;
uniform mat4    uProjectionMatrix ;
uniform mat4    uModelViewMatrix ;
uniform mat4    uNormalMatrix ;

uniform vec3    uMaterialDiffuse ;
uniform vec3    uLightDirection ;
uniform vec3    uLightDiffuse ;

in vec3         aVertexPosition ;
in vec3         aVertexNormal ;

out vec4        vVertexColor;

void main( void ) 
{
    vec3 N      = normalize( vec3( uNormalMatrix * vec4( aVertexNormal, 1.0 ) ) ) ;

    vec3 light  = vec3( uModelViewMatrix * vec4( uLightDirection, 0.0 ) );
    vec3 L      = normalize( light ) ;

    float lambert = dot( N, -L ) ;

    vec3 Id     = uMaterialDiffuse * uLightDiffuse * lambert ;

    vVertexColor = vec4( Id, 1.0 );

    gl_Position = uProjectionMatrix * uModelViewMatrix * vec4( aVertexPosition, 1.0 );

}