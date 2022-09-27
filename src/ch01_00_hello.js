
import * as helloModule from "../js/hello_module.js";


console.log( 'Hello WebGL' );

helloModule.print_hello();


//import * as glMatrix from 'https://cdn.skypack.dev/gl-matrix';
//import * as glMatrix from '/lib/esm/common.js' ;
//import {glMatrix} from '/node_modules/gl-matrix/esm/index.js';
import { glMatrix } from 'gl-matrix' ;

let a = glMatrix.EPSILON ;
console.log( 'EPSILON : ' + a );