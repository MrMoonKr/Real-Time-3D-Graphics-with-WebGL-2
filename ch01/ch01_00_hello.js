/**
 * 1. 직접 로컬 소스 임포트 형태 
 * 2. 웹에서 다운로드형 임포트 가능
 * 3. npm 모듈에서 직접 임포트 가능
 * 4. 결론적으로 노드 개발 환경에서 webpack 으로 전체소스를 하나로 번들링 하여 임포트 필요. ( 브라우저용 JS )
 */


import * as helloModule from "../js/hello_module.js";


console.log( 'Hello WebGL' );

helloModule.print_hello( "함수 인텔리센스 동작 확인용" );

//*
import { glMatrix } from 'https://cdn.skypack.dev/gl-matrix'; // 웹에서 다운로드형 임포트 가능하나 인텔리센스 동작 않음.
let a = glMatrix.EPSILON ;
//*/

/*
import {glMatrix} from '/node_modules/gl-matrix/esm/index.js'; // 노드 모듈에서 임포트 가능하나 인텔리센스 동작 않음.
let a = glMatrix.EPSILON ;
//*/

/*
import {glMatrix} from 'gl-matrix' ; // 모듈 이름으로는 임포트 자체가 안됨. 노드 개발환경에서 인텔리센스 동작 함.
let a = glMatrix.EPSILON ;
//*/

console.log( 'EPSILON : ' + a );