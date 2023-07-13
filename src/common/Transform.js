

import { vec3, quat, mat3, mat4, glMatrix } from "gl-matrix";


const _v1       = vec3.create() ;
const _q1       = quat.create() ;
const _r1       = mat3.create() ;
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
        this.rotationMatrix         = mat4.create() ;
        this.scale                  = vec3.fromValues( 1.0, 1.0, 1.0 ) ;

        this.updateTransformMatrix() ;
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

        this.updateTransformMatrix() ;

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

        mat3.fromMat4( _r1, this.rotationMatrix ) ;
        quat.fromMat3( this.rotation, _r1 ) ;

        this.updateTransformMatrix() ;

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

        this.updateTransformMatrix() ;

        return this ;
    }

    /**
     * 로컬좌표계의 특정 축 방향벡터 쪽으로 옵셋 이동
     * @param {vec3} axis 
     * @param {number} distance 이동 변위 옵셋
     * @returns 
     */
    translateOnAxis( axis, distance )
    {
        vec3.transformQuat( _v1, axis, this.rotation ) ;
        vec3.scale( _v1, _v1, distance ) ;
        vec3.add( this.position, this.position, _v1 ) ;

        this.updateTransformMatrix() ;

        return this;
    }
    /**
     * 로컬 x축 방향 이동
     * @param {number} distance 
     * @returns 
     */
    translateX( distance )
    {
        return this.translateOnAxis( _xAxis, distance ) ;
    }
    /**
     * 로컬 y축 방향 이동.
     * @param {number} distance 
     * @returns 
     */
    translateY( distance )
    {
        return this.translateOnAxis( _yAxis, distance ) ;
    }
    /**
     * 로컬 z축 방향 이동.
     * @param {number} distance 
     * @returns 
     */
    translateZ( distance )
    {
        return this.translateOnAxis( _zAxis, distance ) ;
    }

    /**
     * 로컬좌표계의 특정 축을 중심으로 옵셋 회전
     * @param {vec3} axis 
     * @param {number} angle 
     */
    rotateOnAxis( axis, angle )
    {
        quat.setAxisAngle( _q1, axis, glMatrix.toRadian( angle ) ) ;
        quat.mul( this.rotation, this.rotation, _q1 ) ;

        this.updateTransformMatrix() ;

        return this;
    }
    /**
     * 
     * @param {number} angle 
     * @returns 
     */
    rotateX( angle )
    {
        return this.rotateOnAxis( _xAxis, angle ) ;
    }
    /**
     * 
     * @param {number} angle 
     * @returns 
     */
    rotateY( angle )
    {
        return this.rotateOnAxis( _yAxis, angle ) ;
    }
    /**
     * 
     * @param {number} angle 
     * @returns 
     */
    rotateZ( angle )
    {
        return this.rotateOnAxis( _zAxis, angle ) ;
    }



    /**
     * 전달된 지점 바라보기. ( 월드 좌표계 )
     * @param {vec3} at 
     */
    look( at )
    {
        vec3.copy( _target, at ) ;

        mat4.targetTo( _m1, this.position, _target, _yAxis ) ;

        mat4.getRotation( this.rotation, _m1 ) ;
        mat4.getTranslation( this.position, _m1 ) ;
        mat4.getScaling( this.scale, _m1 ) ;

        this.updateTransformMatrix() ;
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
        if ( Transform.DEFAULT_MATRIX_WORLD_AUTO_UPDATE )
        {
            mat4.fromRotationTranslationScale( this.transformMatrix, this.rotation, this.position, this.scale ) ;

            mat4.copy( this.normalMatrix, this.transformMatrix ) ;
            mat4.invert( this.normalMatrix, this.normalMatrix ) ;
            mat4.transpose( this.normalMatrix, this.normalMatrix ) ;
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


Transform.DEFAULT_UP = vec3.fromValues( 0, 1, 0 ) ;
Transform.DEFAULT_MATRIX_LOCAL_AUTO_UPDATE = true ;
Transform.DEFAULT_MATRIX_WORLD_AUTO_UPDATE = true ;


export default Transform ;
