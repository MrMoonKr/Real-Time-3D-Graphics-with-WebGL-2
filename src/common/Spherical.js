import { vec3 } from "gl-matrix";



/**
 * 구좌표계 표현 클래스
 */
class Spherical
{

    /**
     * 
     * @param {number} radius 
     * @param {number} phi polar angle in radians
     * @param {number} theta azimuthal angle in radians
     * @returns 
     */
    constructor( radius = 1, phi = 0, theta = 0 )
    {
        this.radius = radius ;
        this.phi    = phi ; // polar angle
        this.theta  = theta ; // azimuthal angle

        return this;
    }

    set( radius, phi, theta )
    {
        this.radius = radius ;
        this.phi    = phi ;
        this.theta  = theta ;

        return this;
    }

    copy( other )
    {
        this.radius = other.radius ;
        this.phi    = other.phi ;
        this.theta  = other.theta ;

        return this;
    }

    // restrict phi to be between EPS and PI-EPS
    makeSafe()
    {
        const EPS   = 0.000001 ;
        this.phi    = Math.max( EPS, Math.min( Math.PI - EPS, this.phi ) ) ;

        return this;
    }

    /**
     * 
     * @param {vec3} v 
     */
    setFromVector3( v )
    {
        //return this.setFromCartesianCoords( v.x, v.y, v.z );
        return this.setFromCartesianCoords( v[0], v[1], v[2] ) ;
    }

    /**
     * 
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @returns 
     */
    setFromCartesianCoords( x, y, z )
    {
        this.radius = Math.sqrt( x * x + y * y + z * z );

        if ( this.radius === 0 )
        {
            this.theta  = 0 ;
            this.phi    = 0 ;
        }
        else
        {
            this.theta  = Math.atan2( x, z ) ;
            this.phi    = Math.acos( this._clamp( y / this.radius, -1, 1 ) ) ;
        }

        return this;
    }

    clone()
    {
        return new this.constructor().copy( this );
    }

    _clamp( value, min, max )
    {
        return Math.max( min, Math.min( max, value ) ) ;
    }

    toString()
    {
        return `${this.radius}, ${this.phi}, ${this.theta}` ;
    }

}

export default Spherical ;
