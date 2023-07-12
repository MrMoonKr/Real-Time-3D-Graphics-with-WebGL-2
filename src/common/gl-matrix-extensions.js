import { quat, vec3 } from "gl-matrix";


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
  
    let rotationAxis ;
    if ( dot < -1 + epsilon )
    {
        rotationAxis    = vec3.fromValues( 1, 0, 0 ) ;
    }
    else
    {
        rotationAxis    = vec3.cross( rotationAxis, startVector, targetVector ) ;
    }
  
    const magnitude     = vec3.length( rotationAxis ) ;
  
    const w             = Math.sqrt( ( 1 + dot ) * 2 ) ;
  
    if ( magnitude > epsilon )
    {
        rotationAxis    = vec3.scale( rotationAxis, rotationAxis, 1 / magnitude ) ;
    }

    return quat.setAxisAngle( quat.create(), vec3.normalize( rotationAxis ), Math.acos( dot ) ) ;
}