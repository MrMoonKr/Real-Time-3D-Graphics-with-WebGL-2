'use strict';

// Visualize the axis on the screen
/**
 * 3차원 축 표시용 메시
 */
class Axis 
{

    constructor( dimension = 10 )
    {
        this.alias          = 'axis';
        this.wireframe      = true;
        this.dimension      = dimension;

        /**
         * @type { number[] }
         */
        this.vertices       = [];
        /**
         * @type { number[] }
         */
        this.indices        = [ 0, 1, 2, 3, 4, 5 ];

        this.build( this.dimension )
    }

    build( dimension ) 
    {
        if ( dimension ) 
        {
            this.dimension = dimension;
        }

        this.vertices = 
        [
            -dimension,            0.0,        0.0,
             dimension,            0.0,        0.0,
                   0.0, -dimension / 2,        0.0,
                   0.0,  dimension / 2,        0.0,
                   0.0,            0.0, -dimension,
                   0.0,            0.0,  dimension
        ];
    }

}


export default Axis;