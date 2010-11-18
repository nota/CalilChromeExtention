//console.log( "background" );
window.onload = init

var CMD = {
    xhr : xhr ,
    initGM : initGM ,
    setValue : setValue 
} ;

function init() {
//    console.log( "background.onInit" );
    chrome.extension.onConnect.addListener(function(port) {
//        console.log( "background.onConnect" );
        port.onMessage.addListener( function( message , con ) {
//            console.log( message );

            var args = message.args ;
            if( !( args instanceof Array ) ){ args = [ args ]; }

            args.push( con );
            (CMD[ message.action ]||function(){}).apply( CMD , args ) ;
        });
    });
}

//GM_xmlhttpRequest
function xhr( opt , callbackid , con ) {
    var xhr = new XMLHttpRequest()
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) { 
            callback( con , callbackid , [ xhr ] );
        }
    }
    xhr.open( opt.method , opt.url , true)
    xhr.send(null)
    return xhr
}


//GM_setValue
function setValue( key , value ){
//    console.log( "background.setValue" , key , value );
    localStorage[ key ] = value ;
}


function initGM ( callbackid , con ){
//    console.log( localStorage );
    callback( con , callbackid , localStorage );
}


function callback( con , callbackid , args ){
    if( !( args instanceof Array ) ){ args = [ args ] ; }
    args.unshift( callbackid );
//    console.log( args );
    con.postMessage( { action : "callbackResponse" , args : args } );
}

