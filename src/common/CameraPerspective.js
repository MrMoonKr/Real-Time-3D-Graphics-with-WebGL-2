

import { vec2, vec3, vec4, quat, mat4 } from "gl-matrix" ;

import Transform from "./Transform";

class CameraPerspective extends Transform
{

    /**
     * 캔버스의 해상도에 맞게 카메라 구성
     * @param {HTMLCanvasElement} canvas 
     */
    constructor( canvas )
    {
        super() ;

        this.viewMatrix                 = mat4.create() ;
        this.projectionMatrix           = mat4.create() ;

        this.canvas                     = canvas ;
        this.viewport                   = vec4.fromValues( 0, 0, this.canvas.width, this.canvas.height ) ;

        this.fov                        = 45.0 ;
        this.aspect                     = this.canvas.width / this.canvas.height ;
        this.near                       = 0.1 ;
        this.far                        = 1000.0 ;

        this.setPosition( 0.0, 0.0, 100.0 ) ;

    }


    getProjectionMatrix()
    {
        this.updateProjectionMatrix() ;
        return this.projectionMatrix ;
    }

    getViewMatrix()
    {
        this.updateTransformMatrix() ;
        mat4.invert( this.viewMatrix, this.transformMatrix ) ;

        return this.viewMatrix ;
    }

    setFieldOfView( fov )
    {
        this.fov = fov ;
        this.updateProjectionMatrix() ;

        return this ;
    }

    setAspect( aspect )
    {
        this.aspect = aspect ;
        this.updateProjectionMatrix() ;

        return this ;
    }

    updateProjectionMatrix()
    {
        mat4.perspective( this.projectionMatrix, this.fov, this.aspect, this.near, this.far ) ;
    }

}

export default CameraPerspective ;
