#version 300 es
#pragma vscode_glsllint_stage: frag

precision mediump float;

uniform vec4    uLightAmbient ;
uniform vec4    uLightDiffuse ;
uniform vec4    uLightSpecular ;

uniform vec4    uMaterialAmbient ;
uniform vec4    uMaterialDiffuse ;
uniform vec4    uMaterialSpecular ;
uniform float   uShininess ;

in vec3         vNormal ;
in vec3         vLightRay ;
in vec3         vEyeVector ;

out vec4        fragColor;

void main( void )
{
    vec3 L      = normalize( vLightRay ) ;
    vec3 N      = normalize( vNormal ) ;

    float lambert = dot( N, -L ) ;

    vec4 Ia     = uMaterialAmbient * uLightAmbient ; // Ambient

    vec4 Id     = vec4( 0.0, 0.0, 0.0, 1.0 ) ; // Black Color
    vec4 Is     = vec4( 0.0, 0.0, 0.0, 1.0 ) ; // Black Color

    if ( lambert > 0.0 )
    {
        Id      = uMaterialDiffuse * uLightDiffuse * lambert ;

        vec3 E  = normalize( vEyeVector ) ;
        vec3 R  = reflect( L, N ) ;
        float S = pow( max( dot( R, E ), 0.0 ), uShininess ) ;

        Is      = uMaterialSpecular * uLightSpecular * S ;
    }

    fragColor   = vec4( vec3( Ia + Id + Is ), 1.0 ) ;
}