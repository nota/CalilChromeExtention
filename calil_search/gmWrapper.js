onReadyGM = function(){}
function isChromeExtension() { return (typeof chrome == 'object') && (typeof chrome.extension == 'object') }
function chromeCompatible() {
//    console.log( "gmWrapper.chromeCompatible" );
    var localStorage , 
        isInitialized = false ,
        port = chrome.extension.connect() ;
        Connection = (function(){
            var callbackList = {} , 
                callbackId = 0 ;
    
            function callbackResponse ( id , response ){
//                console.log( "Connection.callbackResponse" );
                callbackList[ id ]( response );
                delete callbackList[ id ];
            }

            function registCallBack( callback ){
//                console.log( "Connection.registCallBack" );
                callbackList[ ++callbackId ] = callback ;
                return callbackId ;
            }

            return {
                callbackResponse : callbackResponse ,
                registCallBack   : registCallBack  
            };
        })();
    ;

//    console.log( port );

    function onInitializedGM( response ){
//        console.log( "onInitializedGM" );
        localStorage = response ;
        isInitialized = true ;

        ( onReadyGM || function(){} )();
    }

    GM_xmlhttpRequest = function( opt ) {
        port.postMessage( { 
            action : "xhr" ,
            args : [ opt , Connection.registCallBack( opt.onload ) ]
        });
    };

    GM_log = function ( message ){ console.log( message ); }
    GM_setValue = function ( key , value ){
        if( !isInitialized ){ 
            console.log( "Error" , "GM_setValue was called before finished initializing" ); 
            return ;
        }

//        console.log( "gmWrapper.GM_setValue" , localStorage );

        localStorage[ key ] = value ;
        port.postMessage( { action : "setValue" , args : [ key , value ] } );
    };
    GM_getValue = function ( key , def   ){
        if( !isInitialized ){ 
            console.log( "Error" , "GM_getValue was called before finished initializing" ); 
            return ;
        }

//        console.log( "gmWrapper.GM_getValue" , localStorage );

        if( localStorage[ key ] == undefined && def != undefined ){
            GM_setValue( key , def );
        }
        return localStorage[ key ] ;
    };
    GM_registerMenuCommand = function ( menuText , callbackFunction ) {};

    port.onMessage.addListener( function( res ) { 
//            console.log( "port.onMessage" , res );
        ( Connection[ res.action ] || function(){} ).apply( Connection , res.args );
    } ) ;

    port.postMessage( { action : "initGM" , args : Connection.registCallBack( onInitializedGM ) } );
}

chromeCompatible(); 

