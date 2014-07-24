/* phpTrackme
 *
 * Copyright(C) 2013 Bartek Fabiszewski (www.fabiszewski.net)
 * Copyright(C) 2014 Mark Campbell-Smith (campbellsmith.me)
 *
 * This is free software; you can redistribute it and/or modify it under
 * the terms of the GNU Library General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU Library General Public
 * License along with this program; if not, write to the Free Software
 * Foundation, Inc., 675 Mass Ave, Cambridge, MA 02139, USA.
 */
 
 // general stuff
if (units=='imperial') {
  factor_kmh = 0.62; //to mph
  unit_kmh = 'mph';
  factor_m = 3.28; // to feet
  unit_m = 'ft';
  factor_km = 0.62; // to miles
  unit_km = 'mi';
} 
else {
  factor_kmh = 1;
  unit_kmh = '/km';
  factor_m = 1;
  unit_m = 'm';
  factor_km = 1;
  unit_km = 'km';
}
var latest = 0;
var latestTime = 0;
var live = 0;
var chart;
var altitudes = new Array();
var altTimeout;
function displayChart() {
  if (chart) { google.visualization.events.removeAllListeners(chart); }
  var data = new google.visualization.DataTable();
  data.addColumn('number', 'id');
  data.addColumn('number', 'altitude');
  var altLen = altitudes.length;
  for (var i=0; i<altLen; i++) {
    data.addRow([(i+1),Math.round((altitudes[i]*factor_m))]);
  }

  var options = {
    title: lang_altitude+' ('+unit_m+')',
    hAxis: { textPosition: 'none' },
    legend: { position: 'none' }
  };

  chart = new google.visualization.LineChart(document.getElementById('chart'));
  chart.draw(data, options);
  
  addChartEvent(chart);
}

function toggleChart(i) {
  var altLen = altitudes.length;
  if (altLen<=1) { return; }  
  var e = document.getElementById('bottom');
  if (arguments.length < 1) {
    if (e.style.display == 'block') { i = 0 }
    else { i = 1; }
  }  
  if (i==0) {
    chart.clearChart();
    e.style.display = 'none';
  }
  else {
    e.style.display = 'block';
    displayChart();
  }
}

function toggleMenu(i) { 
  var emenu = document.getElementById('menu');
  var emain = document.getElementById('main');
  var ebutton = document.getElementById('menu-close');
  if (arguments.length < 1) {
    if (ebutton.innerHTML == '»') { i = 0 }
    else { i = 1; }
  }  
  if (i==0) {
    emenu.style.width = '0';
    emain.style.marginRight = '0';
    ebutton.style.right = '0';
    ebutton.innerHTML = '«';
  }
  else {
    emenu.style.width = '165px';
    emain.style.marginRight = '165px';
    ebutton.style.right = '165px';
    ebutton.innerHTML = '»';
  }  
}

function getXHR() {
  var xmlhttp = null;
  if (window.XMLHttpRequest) {
    xmlhttp=new XMLHttpRequest();
  }
  else {
    xmlhttp=new ActiveXObject('Microsoft.XMLHTTP');
  }
  return xmlhttp;
}

function loadTrack(userid,trackid,update) {
  if (latest==1) { trackid=0; }
  var xhr = getXHR();
  xhr.onreadystatechange = function() {
    if (xhr.readyState==4 && xhr.status==200) {
      var xml = xhr.responseXML;
      var positions = xml.getElementsByTagName('position');      
      if (positions.length>0) {  
        clearMap();        
        displayTrack(xml,update);
      }
      xhr = null;
    }
  }
  xhr.open('GET','getpositions.php?trackid='+trackid+'&userid='+userid,true);
  xhr.send();
}

function parsePosition(p) {
    // read data
  var latitude = getNode(p,'latitude');
  var longitude = getNode(p,'longitude');
  var altitude = 0; // may be null
  //if (altitude != null) { altitude = parseInt(altitude); }
  var speed = getNode(p,'pace'); // may be null
  //speed = 1;
  // var speed = 0;
  //if (speed != null) { speed = parseInt(speed); }
  //var angle = getNode(p,'angle'); // may be null
  var angle = 0;
  //if (angle != null) { angle = parseInt(angle); }
  //var comments = getNode(p,'comments'); // may be null
  var comments = "";
  var username = getNode(p,'username');
  var trackname = getNode(p,'trackname');
  var tid = getNode(p,'trackid');
  var dateadded = getNode(p,'dateadded');
  var distance = parseInt(getNode(p,'distance'));
  var seconds = parseInt(getNode(p,'seconds'));
  var TotalDistance = parseInt(getNode(p,'TotalDistance'));
  var TotalTime = getNode(p,'TotalTime');
  var EventType = getNode(p,'EventType');
  return {
    'latitude': latitude,
    'longitude': longitude,
    'speed' : speed,
    'angle' : angle,
    'username': username,
    'trackname': trackname,
    'tid': tid,
    'dateadded': dateadded,
    'distance': distance,
    'seconds': seconds,
    'totaldistance' : TotalDistance,
    'totaltime' : TotalTime,
    'EventType' : EventType,
  }; 
}

function load(type,userid,trackid) {
  var url = 'download.php?type='+type+'&userid='+userid+'&trackid='+trackid;
  window.location.assign(url);
}

function updateSummary(l,d,s) {
  var t = document.getElementById('summary');
  if (latest==0){
    t.innerHTML = '<u>'+lang_summary+'</u><br />'+
    lang_tdistance+': '+(d.toKm()*factor_km).toFixed(2)+' '+unit_km+'<br />'+
    lang_ttime+': '+s.toHMS();
  }
  else {
    t.innerHTML = '<u>'+lang_latest+':</u><br />'+l;
  }
}

function getNode(p,name) {
  return ((p.getElementsByTagName(name)[0].childNodes[0]) ? p.getElementsByTagName(name)[0].childNodes[0].nodeValue : null);
}


// seconds to (d) H:M:S
Number.prototype.toHMS = function(){
  var s = this;
  var d = Math.floor(s / 86400);
  var h = Math.floor((s % 86400) / 3600);
  var m = Math.floor(((s % 86400) % 3600) / 60);
  s = ((s % 86400) % 3600) % 60;

  return ((d>0)?(d + ' d '):'') + (('00'+h).slice(-2)) + ':' + (('00'+m).slice(-2)) + ':' + (('00'+s).slice(-2)) + '';
}
// meters to km
Number.prototype.toKm = function() {
  return Math.round(this/10)/100;
}
// m/s to km/h
Number.prototype.toKmH = function() {
  return Math.round(this*3600/10)/100;
}

// negate value
function toggleLatest() {
  if (latest==0) {
    latest = 1;
    loadTrack(userid,0,1);
  }
  else {
    latest = 0;
    loadTrack(userid,trackid,1);
  }
}

function setTrack(t) {
  document.getElementsByName('track')[0].value = t;
}

function selectTrack(f) {
  trackid=f.options[f.selectedIndex].value;
  document.getElementById('latest').checked = false;
  if (latest==1) { toggleLatest(); }
  loadTrack(userid,trackid,1);
}

function selectUser(f) {
  userid=f.options[f.selectedIndex].value;
  if (f.options[0].disabled==false) {
    f.options[0].disabled = true;
  }
  document.getElementById('latest').checked = false;
  if (latest==1) { toggleLatest(); }
  getTrips(userid);
}

function getTrips(userid) {
  var xhr = getXHR();
  xhr.onreadystatechange = function() {
    if (xhr.readyState==4 && xhr.status==200) {
      var xml = xhr.responseXML;
      var trips = xml.getElementsByTagName('trip');
      if (trips.length>0) {  
        fillOptions(xml);
      }
      xhr = null;
    }
  }
  xhr.open('GET','gettrips.php?userid='+userid,true);
  xhr.send();  
}

function fillOptions(xml) {
  var trackSelect =  document.getElementsByName('track')[0];
  clearOptions(trackSelect);
  var trips = xml.getElementsByTagName('trip');
  var trpLen = trips.length;
  for (var i=0; i<trpLen; i++) {
    var trackid = getNode(trips[i],'trackid');
    var trackname = getNode(trips[i],'trackname');
    var option = document.createElement("option");
    option.value = trackid;
    option.innerHTML = trackname;
    trackSelect.appendChild(option);
  }  
  var defaultTrack = getNode(trips[0],'trackid');
  loadTrack(userid,defaultTrack,1);
}

function clearOptions(el){
  if (el.options) {
    while (el.options.length) {
      el.remove(0);
    }
  }
}

var auto;
function autoReload() {
  if (live==0) {
    live = 1;
    auto = setInterval(function() { loadTrack(userid,trackid,0); },interval*1000);
  }
  else {
    live = 0;
    clearInterval(auto);
  }
}

function setTime() {
  var i = parseInt(prompt(lang_newinterval));
  if (!isNaN(i) && i!=interval) {
    interval = i;
    document.getElementById('auto').innerHTML = interval;
    // if live tracking on, reload with new interval
    if (live==1) { 
      live = 0;
      clearInterval(auto);
      autoReload();
    }
  // save current state as default
	setCookie('interval',interval,30);
  }               
}

// dynamic change of map api
var savedBounds;
function loadMapAPI(api) {
	savedBounds = getBounds();
	document.getElementById("map-canvas").innerHTML = '';
	var url = new Array();
	if (api=='gmaps') { 
		url.push('api_gmaps.js');
		url.push('//maps.googleapis.com/maps/api/js?'+((gkey!==null)?('key='+gkey+'&'):'')+'sensor=false&callback=init'); 
	}
	else { 
		url.push('api_openlayers.js'); 
		url.push('http://openlayers.org/api/OpenLayers.js'); 
	}
	addScript(url[0]);
	waitAndLoad(api,url);	
}
var loadTime = 0;
function waitAndLoad(api,url) {
	// wait till first script loaded
	if (loadTime>5000) { loadTime = 0; alert('Sorry, can\'t load '+api+' API'); return; }
	if (loadedAPI!==api) {
	setTimeout(function() { loadTime += 50; waitAndLoad(api,url); }, 50);
		return;
	}      
	if(!isScriptLoaded(url[1])){
		addScript(url[1]);
	}
	loadTime = 0;
	waitAndInit(api);
}

function waitAndInit(api) {
	// wait till main api loads
	if (loadTime>10000) { loadTime = 0; alert('Sorry, can\'t load '+api+' API'); return; }
	try {
		init();
	}
	catch(e) {
		setTimeout(function() { loadTime += 50; waitAndInit(api); }, 50);
		return;
	}
	loadTime = 0;
	zoomToBounds(savedBounds);
	loadTrack(userid,trackid,0);
	// save current api as default
	setCookie('api',api,30);
}

function addScript(url) {
	var tag = document.createElement('script');
	tag.setAttribute('type','text/javascript');
	tag.setAttribute('src', url);
	if (typeof tag!='undefined') {
		document.getElementsByTagName('head')[0].appendChild(tag);
	}	
}

function isScriptLoaded(url) {
	scripts = document.getElementsByTagName('script');
	for (var i = scripts.length; i--;) {
		// check if url matches src
		var scriptUrl = scripts[i].src.replace(/https?:/,'');
		if (scriptUrl != '' && url.indexOf(scriptUrl) !== -1) return true;
	}
	return false;
}

function setCookie(name,value,days) {
	if (days) {
    var date = new Date();
    date.setTime(date.getTime()+(days*24*60*60*1000));
    var expires = '; expires='+date.toGMTString();
	}
	else { 
    var expires = ''; 
	}
	document.cookie = 'phpTrackme_'+name+'='+value+expires+'; path=/';
}

function setLang(lang) {
  setCookie('lang',lang,30);
  location.reload();
}

function setUnits(unit) {
  units = unit;
  setCookie('units',unit,30);
  location.reload();
}

function showOverlayBox() {
        //if box is not set to open then don't do anything
        if( isOpen == false ) return;
        // set the properties of the overlay box, the left and top positions
        $('.overlayBox').css({
                display:'block',
                left:( $(window).width() - $('.overlayBox').width() )/2,
                top:( $(window).height() - $('.overlayBox').height() )/2 - 20,
                position:'absolute'
        });
        // set the window background for the overlay. i.e the body becomes darker
        $('.bgCover').css({
                display:'block',
                width: $(window).width(),
                height:$(window).height(),
        });
}
function doOverlayOpen() {
        //set status to open
        isOpen = true;
        showOverlayBox();
        $('.bgCover').css({opacity:0}).animate( {opacity:0.5, backgroundColor:'#000'} );
        // dont follow the link : so return false.
        return false;
}
function doOverlayClose() {
        //set status to closed
        isOpen = false;
        $('.overlayBox').css( 'display', 'none' );
        // now animate the background to fade out to opacity 0
        // and then hide it after the animation is complete.
        $('.bgCover').animate( {opacity:0}, null, null, function() { $(this).hide(); } );
}

// if window is resized then reposition the overlay box
$(window).bind('resize',showOverlayBox);
// activate when the link with class launchLink is clicked
$('a.launchLink').click( doOverlayOpen );
// close it when closeLink is clicked
$('a.closeLink').click( doOverlayClose );


