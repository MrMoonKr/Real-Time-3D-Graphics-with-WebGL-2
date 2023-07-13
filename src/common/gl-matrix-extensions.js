import { quat, vec3 } from "gl-matrix";

import Spherical from "./Spherical";


const DEG2RAD = Math.PI / 180.0 ;
const RAD2DEG = 180.0 ; Math.PI ;


/**
 * 
 * @param {vec3} from 
 * @param {vec3} to 
 * @returns {quat}
 */
export function quatFromVec3( from, to ) 
{
    const epsilon       = 1e-6 ;

    vec3.normalize( from, from ) ;
    vec3.normalize( to, to ) ;
  
    const dot = vec3.dot( from, to ) ;
  
    let rotationAxis = vec3.create() ;
    if ( dot < -1 + epsilon )
    {
        rotationAxis    = vec3.fromValues( 1, 0, 0 ) ;
    }
    else
    {
        rotationAxis    = vec3.cross( rotationAxis, from, to ) ;
    }
  
    const magnitude     = vec3.length( rotationAxis ) ;
  
    const w             = Math.sqrt( ( 1 + dot ) * 2 ) ;
  
    if ( magnitude > epsilon )
    {
        rotationAxis    = vec3.scale( rotationAxis, rotationAxis, 1 / magnitude ) ;
    }

    return quat.setAxisAngle( quat.create(), vec3.normalize( rotationAxis, rotationAxis ), Math.acos( dot ) ) ;
}

/**
 * 
 * @param {Spherical} spherical 
 * @returns 
 */
export function vec3FromSpherical( spherical )
{
    const x = spherical.radius * Math.sin( spherical.phi ) * Math.sin( spherical.theta ) ;
    const y = spherical.radius * Math.cos( spherical.phi ) ;
    const z = spherical.radius * Math.sin( spherical.phi ) * Math.cos( spherical.theta ) ;
  
    return vec3.fromValues( x, y, z ) ;
}

/**
 * 
 * @param {vec3} v 
 * @returns 
 */
export function sphericalFromVec3( v )
{
    const s = new Spherical() ;
    s.setFromVector3( v ) ;

    return s ;
}