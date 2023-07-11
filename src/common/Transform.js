

import { vec3, quat, mat3, mat4, glMatrix } from "gl-matrix";


const _v1       = vec3.create() ;
const _q1       = quat.create() ;
const _m1       = mat4.create() ;
const _target   = vec3.create() ;

const _xAxis    = vec3.fromValues( 1.0, 0.0, 0.0 ) ;
const _yAxis    = vec3.fromValues( 0.0, 1.0, 0.0 ) ;
const _zAxis    = vec3.fromValues( 0.0, 0.0, 1.0 ) ;


class Transform 
{


    constructor()
    {
        this.transformMatrix        = mat4.create() ;
        this.normalMatrix           = mat4.create() ;

        this.position               = vec3.create() ;
        this.rotation               = quat.create() ;
        this.scale                  = vec3.fromValues( 1.0, 1.0, 1.0 ) ;

        this.needUpdateTransform    = true ;
    }

    /**
     * 
     * @param {number|Array<number>} x 
     * @param {*} y 
     * @param {*} z 
     * @returns 
     */
    setPosition( x, y = this.position[1], z = this.position[2] )
    {
        if ( x.constructor === Array )
        {
            vec3.copy( this.position, x ) ;
        }
        else
        {
            vec3.set( this.position, x, y, z ) ;
        }

        this.needUpdateTransform = true ;

        return this ;
    }

    /**
     * 
     * @param {number|Array<number>} x 
     * @param {*} y 
     * @param {*} z 
     * @returns 
     */
    setRotation( x, y = 0, z = 0 )
    {
        mat4.identity( this.rotationMatrix ) ;

        if ( x.constructor === Array )
        {
            mat4.rotateX( this.rotationMatrix, this.rotationMatrix, glMatrix.toRadian( x[0] ) ) ;
            mat4.rotateY( this.rotationMatrix, this.rotationMatrix, glMatrix.toRadian( x[1] ) ) ;
            mat4.rotateZ( this.rotationMatrix, this.rotationMatrix, glMatrix.toRadian( x[2] ) ) ;
        }
        else
        {
            mat4.rotateX( this.rotationMatrix, this.rotationMatrix, glMatrix.toRadian( x ) ) ;
            mat4.rotateY( this.rotationMatrix, this.rotationMatrix, glMatrix.toRadian( y ) ) ;
            mat4.rotateZ( this.rotationMatrix, this.rotationMatrix, glMatrix.toRadian( z ) ) ;
        }

        const m3 = mat3.create() ;
        mat3.fromMat4( m3, this.rotationMatrix ) ;
        quat.fromMat3( this.rotation, m3 ) ;

        this.needUpdateTransform = true ;

        return this ;
    }

    /**
     * 
     * @param {number|Array<number>} x 
     * @param {*} y 
     * @param {*} z 
     * @returns 
     */
    setScale( x, y = this.scale[1], z = this.scale[2] )
    {
        if ( x.constructor === Array )
        {
            vec3.copy( this.scale, x ) ;
        }
        else
        {
            vec3.set( this.scale, x, y, z ) ;
        }

        this.needUpdateTransform = true ;

        return this ;
    }

    translateOnAxis( axis, distance )
    {
        vec3.transformQuat( _v1, axis, this.rotation ) ;
        vec3.scale( _v1, _v1, distance ) ;
        vec3.add( this.position, this.position, _v1 ) ;

        return this ;
    }
    translateX( distance )
    {
        return this.translateOnAxis( _xAxis, distance ) ;
    }

    translateY( distance )
    {
        return this.translateOnAxis( _yAxis, distance ) ;
    }

    translateZ( distance )
    {
        return this.translateOnAxis( _zAxis, distance ) ;
    }

    look( x, y = _target[1], z = _target[2] )
    {
        if ( x.constructor === Array )
        {
            vec3.copy( _target, x ) ;
        }
        else
        {
            vec3.set( _target, x, y, z ) ;
        }

        mat4.targetTo( _m1, this.position, _target, _yAxis ) ;

        mat4.getRotation( this.rotation, _m1 ) ;
        mat4.getTranslation( this.position, _m1 ) ;
        mat4.getScaling( this.scale, _m1 ) ;

        this.needUpdateTransform = true ;
    }

    /**
     * 변환행렬 얻기
     * @returns 
     */
    getTransformMatrix( forceUpdate = true )
    {
        this.updateTransformMatrix() ;
        return this.transformMatrix ;
    }

    updateTransformMatrix()
    {
        if ( this.needUpdateTransform )
        {
            mat4.fromRotationTranslationScale( this.transformMatrix, this.rotation, this.position, this.scale ) ;
            mat4.copy( this.normalMatrix, this.transformMatrix ) ;
            mat4.invert( this.normalMatrix, this.normalMatrix ) ;
            mat4.transpose( this.normalMatrix, this.normalMatrix ) ;

            this.needUpdateTransform = false ;
        }
    }


    /**
     * 360도 각도를 radian 각도로 변환.
     * @param {number} angle 
     * @returns 
     */
    D2R( angle )
    {
        return angle * Math.PI / 180 ;
    }

    /**
     * radian 각도를 360도 각도로 변환
     * @param {number} radian 라디안 각도
     * @returns 
     */
    R2D( radian )
    {
        return radian * 180 / Math.PI ;
    }
}

export default Transform ;
