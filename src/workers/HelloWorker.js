

onmessage = function ( event ) {

    console.log( '[HelloWorker.js] 워커 요청 메시지 받음' );
    console.log( event.data ) ;

    console.log( '안녕하세요 ㅎㅎ' );


    postMessage( '[HelloWorker.js] 워커 응답 메시지 보냄' );
}


