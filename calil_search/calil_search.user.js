// ==UserScript==
// @name           Calil_Search
// @namespace      http://calil.jp
// @include        http://search.yahoo.co.jp/search?*
// @require http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js
// @require http://calil.jp/public/js/calilapi.js?2
// ==/UserScript==


if( typeof isChromeExtension == "undefined" ){ //chrome wrapperが読み込まれていない場合
    init();
}else{
    function onReadyGM(){
        init();
    }
}

var APP_KEY = '2bc265ea827cb23b11d1ee80a25ef575';

function init(){
	
	isYahoo = location.href.match('http://search.yahoo.co.jp/search?');
	isGoogle = location.href.match('http://www.google.co.jp/search?');

	if(!isYahoo && !isGoogle){
		return;
	}

	if(isYahoo){
		list = $('#WS2m');
		links = $('#WS2m li').find('h3 a');
	}
	if(isGoogle){
		list = $('#ires');
		links = $('#ires li a.l');
	}


	if(list == null){
		return;
	}

	var isbns = [];
	links.each(function(i, e){
		var isbn = getISBN(e.href);
		if(isbn){
			isbns.push(isbn);
		}
	});
	log(isbns)
	
	if(isbns.length == 0){
		setLink();
		return;
	}

	var raw_isbn = isbns[0];

	var url = 'http://api.calil.jp/isbn10?q='+raw_isbn;
	GM_xmlhttpRequest({
		method:'GET', 
		url:url,
		onload:function(data){
			var isbn = data.responseText;
			if(data.responseText == 'error'){
				isbn = raw_isbn;
			}
			if(!validateISBN(isbn)){
				setLink();
				return;
			}

			var url = 'http://amzproxy.appspot.com/json?store=Books&keyword='+raw_isbn;
			GM_xmlhttpRequest({
				method:'GET', 
				url:url,
				onload:function(data){
					data = eval(data.responseText);
				}
			});

			setCalil(isbn, list);

		}
	});


}

function callback(data){
	if(typeof data[0] == 'undefined'){
		setLink();
		return;
	}
	$('#calil_title').html(data[0].title);
	$('#calil_author').html(data[0].author);
}

function getISBN(url){

	var isbns = url.match(/(4[0-9A-Z\-]{9,16})/g);
	if(isbns != null){
		return isbns[0];
	}else{
		return false;
	}

}

function setLink(){
	var link = parseURL(location.href);
	if(isYahoo){
		var keyword = link.params['p'];
		var style = 'display:block;margin-left:23px;margin-bottom:15px;';
	}
	if(isGoogle){
		var keyword = link.params['q'];
		var style = '';
	}
	list.before([
		'<div style="'+style+'">',
		'<a href="http://calil.jp/search?q='+keyword+'" target="_blank">',
		'☆このキーワードで本を探す',
		'</a>',
		'</div>'
	].join(''));
}

function setCalil(isbn, list){
	var link = parseURL(location.href);

	$(document.body).append('<script src="http://ajax.googleapis.com/ajax/libs/jquery/1.3.2/jquery.min.js"></script>');
	$(document.body).append('<link href="http://calil.jp/public/css/calilapi.css?2" rel="stylesheet" type="text/css" />');

	if(isYahoo){
		var div = '<div class="calil_waku" style="margin-left: 23px;margin-bottom:15px;padding: 10px 10px 10px 20px;border:1px solid #00CAFF;background-color:white;-webkit-border-radius:10px;width:90%;min-height:77px;overflow:hidden;" id="calil">';
		var keyword = link.params['p'];
	}
	if(isGoogle){
		var div = '<div class="calil_waku" style="font-size: 80%;margin-bottom:15px;padding: 10px 10px 10px 20px;border:1px solid #00CAFF;background-color:white;-webkit-border-radius:10px;width:96%;min-height:77px;overflow:hidden;" id="calil">';
		var keyword = link.params['q'];
	}

	if(keyword.match(/\+%E6%9C%AC\+site:amazon.co.jp/)){
		keyword = keyword.split('+%E6%9C%AC+site:amazon.co.jp')[0];
	}

	list.before([
		'<style type="text/css" media="screen">',
			'.calil_waku {',
				'background-image: url(http://gyazo.com/82e3b479c52e08d80312db9fb5ec9357.png);',
				'background-repeat: no-repeat;',
				'background-position: top right;',
			'}',
			'.calil_status {',
				'font-size: 13px !important;',
				'font-weight: bold;',
				'width: 114px !important;',
			'}',
		'</style>',
		div,
			'<div style="float:left;width:50%; margin-right: 10px;border-right: 1px solid #00CAFF;padding-right:30px;margin-right:15px;">',
				'<div style="float:left; margin-right: 10px;">',
					'<a href="http://www.amazon.co.jp/exec/obidos/ASIN/'+isbn+'" target="_blank">',
					'<img border="0" src="http://images-jp.amazon.com/images/P/' + isbn +'.09.THUMBZZZ.jpg" style="background-color:white;" alt="" onload="if(this.width==\'1\') this.src=\'http://calil.jp/public/img/no-image/small.gif\';">',
					'</a>',
				'</div>',
				'<div id="calil_title" style="font: 110% bold;margin-bottom: 1px;"></div>',
				'<div id="calil_author" style="margin-bottom: 5px;max-width: 76%;"></div>',
			'</div>',
			'<div style="float:left;">',
				'<span id="calil_setting" style="display:none;"><strong id="calil_pref"></strong>',
				'<span id="calil_change"> (<a href="javascript:var w = $(\'#calil_place_dialog_wrapper\');var d = $(\'#calil_place_dialog\');w.show();d.show(\'fast\', function(){w.css(\'height\', $(window).height());w.css(\'width\', $(window).width());d.css(\'top\',($(window).height()-d.height())/2+$(window).scrollTop() + \'px\');d.css(\'left\',($(window).width()-d.width())/2+$(window).scrollLeft() + \'px\')});">変更</a>)</span></span>',
				'<div id="'+isbn+'"></div>',
			'</div>',
			'<div style="float:right;color:#00CAFF;margin-top:40px;font-size:85%;display:block;height:3.5em;">',
				'<div style="display:inline-block;float:right;">',
					'<span>',
					'powered by',
					'<br /><a href="http://calil.jp/search?q='+keyword+'" target="_blank">',
					'<img src="http://gyazo.com/4f0c5703793d55b610d0084aa20f0d2f.png" border="0" alt="Calil" width="73" height="22" align="absmiddle">',
					'</a><br />',
					//'<a href="http://calil.jp/search?q='+keyword+'" target="_blank" style="color:#00CAFF;text-decoration:none;">もっと本を探そう</a>',
				'</div>',
				'</div>',
			'</div>',
		'</div>'
	].join(''));

	on_select_city = function(systemid_list, pref){
		$('#calil_pref').html(pref);
		//$('#calil_change').hide();
		$('#calil_setting').show();
		//var setting = {'pref': pref, 'systemid_list': systemid_list}
		GM_setValue('calil_pref', pref);
		GM_setValue('calil_systemid', systemid_list.join(','));
		showCalil(isbn, systemid_list);
	}

	var pref = GM_getValue('calil_pref');
	var systemid = GM_getValue('calil_systemid');
	if(typeof systemid != 'undefined'){
		var systemid_list = systemid.split(',');
	}
	var isShowDlg = (typeof systemid == 'undefined');

	//GM_deleteValue('calil_setting')

	window.city_selector = new CalilCitySelectDlg({
		'appkey' : APP_KEY,
		'select_func' : on_select_city,
		'getstart' : isShowDlg
	});

	if(isShowDlg == true) return;

	$('#calil_pref').html(pref);
	$('#calil_setting').show();

	showCalil(isbn, systemid_list);

}

function showCalil(isbn, systemid_list){
	var calil = new Calil({
		'appkey' : APP_KEY,
		'render': new CalilRender(),
		'isbn' : isbn,
		'systemid' : systemid_list
	});
	calil.search();
}

// This functions takes a string containing
// an ISBN (ISBN-10 or ISBN-13) and returns
// true if it's valid or false if it's invalid.
function validateISBN(isbn) {
  if(isbn.match(/[^0-9xX\.\-\s]/)) {
    return false;
  }
 
  isbn = isbn.replace(/[^0-9xX]/g,'');
 
  if(isbn.length != 10 && isbn.length != 13) {
    return false;
  }
 
    checkDigit = 0;
  if(isbn.length == 10) {
    checkDigit = 11 - ( (
                 10 * isbn.charAt(0) +
                 9  * isbn.charAt(1) +
                 8  * isbn.charAt(2) +
                 7  * isbn.charAt(3) +
                 6  * isbn.charAt(4) +
                 5  * isbn.charAt(5) +
                 4  * isbn.charAt(6) +
                 3  * isbn.charAt(7) +
                 2  * isbn.charAt(8)
                ) % 11);
 
    if(checkDigit == 10) {
      return (isbn.charAt(9) == 'x' || isbn.charAt(9) == 'X') ? true : false;
    } else {
      return (isbn.charAt(9) == checkDigit ? true : false);
    }
  } else {
    checkDigit = 10 -  ((
                 1 * isbn.charAt(0) +
                 3 * isbn.charAt(1) +
                 1 * isbn.charAt(2) +
                 3 * isbn.charAt(3) +
                 1 * isbn.charAt(4) +
                 3 * isbn.charAt(5) +
                 1 * isbn.charAt(6) +
                 3 * isbn.charAt(7) +
                 1 * isbn.charAt(8) +
                 3 * isbn.charAt(9) +
                 1 * isbn.charAt(10) +
                 3 * isbn.charAt(11)
                ) % 10);
 
    if(checkDigit == 10) {
      return (isbn.charAt(12) == 0 ? true : false) ;
    } else {
      return (isbn.charAt(12) == checkDigit ? true : false);
    }
  }
}

// This function creates a new anchor element and uses location
// properties (inherent) to get the desired URL data. Some String
// operations are used (to normalize results across browsers).
 
function parseURL(url) {
    var a =  document.createElement('a');
    a.href = url;
    return {
        source: url,
        protocol: a.protocol.replace(':',''),
        host: a.hostname,
        port: a.port,
        query: a.search,
        params: (function(){
            var ret = {},
                seg = a.search.replace(/^\?/,'').split('&'),
                len = seg.length, i = 0, s;
            for (;i<len;i++) {
                if (!seg[i]) { continue; }
                s = seg[i].split('=');
                ret[s[0]] = s[1];
            }
            return ret;
        })(),
        file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
        hash: a.hash.replace('#',''),
        path: a.pathname.replace(/^([^\/])/,'/$1'),
        relative: (a.href.match(/tp:\/\/[^\/]+(.+)/) || [,''])[1],
        segments: a.pathname.replace(/^\//,'').split('/')
    };
}

function log(text){
	try{
		GM_log(text);
	}catch( e ){}
}
