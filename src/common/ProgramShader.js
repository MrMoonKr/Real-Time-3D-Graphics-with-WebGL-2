


class ProgramShader 
{
    constructor()
    {
        //
    }

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {string} shaderCode 
     * @param {number} shaderType gl.VERTEX_SHADER | gl.FRAGMENT_SHADER
     * @returns {WebGLShader}
     */
    static compileShader( gl, shaderCode, shaderType ) 
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
}

export default ProgramShader;
