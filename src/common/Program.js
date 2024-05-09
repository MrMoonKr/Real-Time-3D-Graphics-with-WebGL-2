'use strict';

import utils from "./Utils.js";

import ProgramShader from "./ProgramShader.js";

// Program constructor that takes a WebGL context and script tag IDs
// to extract vertex and fragment shader source code from the page
class Program {

    /**
     * 
     * @param {WebGL2RenderingContext} gl WebGL2
     * @param {String} vertexShaderId DOM Element ID
     * @param {String} fragmentShaderId DOM Element ID
     * @returns 
     */
    constructor( gl, vertexShaderId, fragmentShaderId ) {

        /**
         * @type {WebGL2RenderingContext}
         */
        this.gl = gl;
        /**
         * @type {WebGLProgram}
         */
        this.program = gl.createProgram();

        if ( !( vertexShaderId && fragmentShaderId ) ) 
        {
            return console.error( 'No shader IDs were provided' );
        }

        gl.attachShader( this.program, utils.getShader( gl, vertexShaderId ) );
        gl.attachShader( this.program, utils.getShader( gl, fragmentShaderId ) );
        gl.linkProgram( this.program );
        if ( !this.gl.getProgramParameter( this.program, this.gl.LINK_STATUS ) ) 
        {
            return console.error( 'Could not initialize shaders.' );
        }

        this.useProgram();
    }

    // Sets the WebGL context to use current program
    useProgram() 
    {
        this.gl.useProgram( this.program );
    }

    // Load up the given attributes and uniforms from the given values
    /**
     * 
     * @param {Array<String>} attributes Names of Attributes
     * @param {Array<String>} uniforms Names of Uniforms
     */
    load( attributes, uniforms ) 
    {
        this.useProgram();
        this.setAttributeLocations( attributes );
        this.setUniformLocations( uniforms );
    }

    // Set references to attributes onto the program instance
    /**
     * 
     * @param {string[]} attributes 
     */
    setAttributeLocations( attributes ) 
    {
        attributes.forEach( attribute => {
            this[ attribute ] = this.gl.getAttribLocation( this.program, attribute );
        } );
    }

    // Set references to uniforms onto the program instance
    /**
     * 
     * @param {string[]} uniforms 
     */
    setUniformLocations( uniforms ) 
    {
        uniforms.forEach( uniform => {
            this[ uniform ] = this.gl.getUniformLocation( this.program, uniform );
        } );
    }

    // Get the uniform location from the program
    getUniform( uniformLocation ) 
    {
        return this.gl.getUniform( this.program, uniformLocation );
    }

    /**
     * 
     * @param {WebGL2RenderingContext} gl 
     * @param {string} vertCode 
     * @param {string} fragCode 
     * @returns {WebGLProgram|null}
     */
    static initProgram( gl, vertCode, fragCode ) 
    {
        const vertexShader   = ProgramShader.compileShader( gl, vertCode, gl.VERTEX_SHADER );
        const fragmentShader = ProgramShader.compileShader( gl, fragCode, gl.FRAGMENT_SHADER );

        const program = gl.createProgram();
        gl.attachShader( program, vertexShader );
        gl.attachShader( program, fragmentShader );
        gl.linkProgram( program );
    
        if ( !gl.getProgramParameter( program, gl.LINK_STATUS ) ) 
        {
            console.error( "[e] shader program error : " + gl.getProgramInfoLog( program ) ) ;
            gl.deleteProgram( program );
            return null;
        }

        gl.useProgram( program );

        return program;
    }

}

export default Program;
