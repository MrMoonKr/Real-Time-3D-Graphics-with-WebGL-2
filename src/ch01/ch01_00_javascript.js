
import * as helloModule from "../../js/hello_module.js";
//import { print_hello } from '../js/hello_module.js';


console.log( 'Hello WebGL' );

helloModule.print_hello( "함수 인텔리센스 동작 확인용" );
//print_hello( "함수 인텔리센스 동작 확인용" );


import { glMatrix } from 'gl-matrix' ;

let a = glMatrix.EPSILON ;
console.log( 'EPSILON : ' + a );

