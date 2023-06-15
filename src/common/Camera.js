'use strict';

import { vec3, vec4, mat4 } from 'gl-matrix';
import * as glm from 'gl-matrix' ;

// Abstraction over constructing and interacting with a 3D scene using a camera
class Camera 
{

    constructor( type = Camera.ORBITING_TYPE ) 
    {
        const { vec3, mat4 } = glm ;


        this.position   = vec3.create();
        this.focus      = vec3.create();
        this.home       = vec3.create();

        this.up         = vec3.create();
        this.right      = vec3.create();
        this.normal     = vec3.create();

        /**
         * @type {mat4} 뷰행렬. 카메라의 월드변환 행렬
         */
        this.matrix     = mat4.create();

        // You could have these options be passed in via the constructor
        // or allow the consumer to change them directly
        this.steps      = 0;
        this.azimuth    = 0;
        this.elevation  = 0;
        this.fov        = 45;
        this.minZ       = 0.1;
        this.maxZ       = 10000;

        this.setType( type );
    }

    // Return whether the camera is in orbiting mode
    isOrbiting() 
    {
        return this.type === Camera.ORBITING_TYPE;
    }

    // Return whether the camera is in tracking mode
    isTracking() 
    {
        return this.type === Camera.TRACKING_TYPE;
    }

    // Change camera type
    setType( type ) 
    {
        ~Camera.TYPES.indexOf( type ) ?
            this.type = type :
            console.error( `Camera type (${type}) not supported` );
    }

    // Position the camera back home
    goHome( home ) 
    {
        if ( home ) 
        {
            this.home = home;
        }

        this.setPosition( this.home );
        this.setAzimuth( 0 );
        this.setElevation( 0 );
    }

    // Dolly the camera
    dolly( stepIncrement ) 
    {
        const normal = vec3.create();
        const newPosition = vec3.create();
        vec3.normalize( normal, this.normal );

        const step = stepIncrement - this.steps;

        if ( this.isTracking() ) {
            newPosition[ 0 ] = this.position[ 0 ] - step * normal[ 0 ];
            newPosition[ 1 ] = this.position[ 1 ] - step * normal[ 1 ];
            newPosition[ 2 ] = this.position[ 2 ] - step * normal[ 2 ];
        } else {
            newPosition[ 0 ] = this.position[ 0 ];
            newPosition[ 1 ] = this.position[ 1 ];
            newPosition[ 2 ] = this.position[ 2 ] - step;
        }

        this.steps = stepIncrement;
        this.setPosition( newPosition );
    }

    // Change camera position
    /**
     * 카메라의 월드상의 위치 설정.
     * @param {glm.vec3} position 
     */
    setPosition( position ) 
    {
        const { vec3 } = glm ;

        vec3.copy( this.position, position );
        this.update();
    }

    // Change camera focus
    /**
     * 카메라가 바라보는 월드상의 위치.
     * @param {glm.vec3} focus 
     */
    setFocus( focus ) 
    {
        glm.vec3.copy( this.focus, focus );
        this.update();
    }

    // Set camera azimuth
    setAzimuth( azimuth )
    {
        this.changeAzimuth( azimuth - this.azimuth );
    }

    // Change camera azimuth
    changeAzimuth( azimuth ) 
    {
        this.azimuth += azimuth;

        if ( this.azimuth > 360 || this.azimuth < -360 ) 
        {
            this.azimuth = this.azimuth % 360;
        }

        this.update();
    }

    // Set camera elevation
    /**
     * 올려다 보는 각도 설정
     * @param {number} elevation 
     */
    setElevation( elevation ) 
    {
        this.changeElevation( elevation - this.elevation );
    }

    // Change camera elevation
    /**
     * 
     * @param {number} elevation 올려다보는 각도( 360도 )
     */
    changeElevation( elevation ) 
    {
        this.elevation += elevation;

        if ( this.elevation > 360 || this.elevation < -360 ) 
        {
            this.elevation = this.elevation % 360;
        }

        this.update();
    }

    // Update the camera orientation
    /**
     * update right, up, normal(look)
     */
    calculateOrientation() 
    {
        const right = vec4.create();
        vec4.set( right, 1, 0, 0, 0 );
        vec4.transformMat4( right, right, this.matrix );
        vec3.copy( this.right, right );

        const up = vec4.create();
        vec4.set( up, 0, 1, 0, 0 );
        vec4.transformMat4( up, up, this.matrix );
        vec3.copy( this.up, up );

        const normal = vec4.create();
        vec4.set( normal, 0, 0, 1, 0 );
        vec4.transformMat4( normal, normal, this.matrix );
        vec3.copy( this.normal, normal );
    }

    // Update camera values
    /**
     * 카메라의 월드변환 행렬 계산
     */
    update() 
    {
        mat4.identity( this.matrix );

        if ( this.isTracking() ) // 1인칭 자유이동 모드
        {
            mat4.rotateY( this.matrix, this.matrix, this.azimuth   * Math.PI / 180 );
            mat4.rotateX( this.matrix, this.matrix, this.elevation * Math.PI / 180 );
            mat4.translate( this.matrix, this.matrix, this.position );
        } 
        else // 3인칭 중심축 회전 모드
        {
            mat4.rotateY( this.matrix, this.matrix, this.azimuth   * Math.PI / 180 );
            mat4.rotateX( this.matrix, this.matrix, this.elevation * Math.PI / 180 );
            mat4.translate( this.matrix, this.matrix, this.position );
        }

        // We only update the position if we have a tracking camera.
        // For an orbiting camera we do not update the position. If
        // Why do you think we do not update the position?
        if ( this.isTracking() ) 
        {
            const position = vec4.create();
            vec4.set( position, 0, 0, 0, 1 );
            vec4.transformMat4( position, position, this.matrix );
            vec3.copy( this.position, position );
        }

        this.calculateOrientation();
    }

    // Returns the view transform
    /**
     * 
     * @returns {glm.mat4} 카메라 월드변환 행렬의 역행렬
     */
    getViewTransform() 
    {
        const matrix = mat4.create();
        mat4.invert( matrix, this.matrix );
        return matrix;
    }

}

// Two defined modes for the camera
Camera.TYPES = [ 'ORBITING_TYPE', 'TRACKING_TYPE' ];
Camera.TYPES.forEach( type => Camera[ type ] = type );

export default Camera;