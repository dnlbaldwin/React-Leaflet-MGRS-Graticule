(this["webpackJsonpreact-leaflet-mgrs-graticule-example"]=this["webpackJsonpreact-leaflet-mgrs-graticule-example"]||[]).push([[0],{23:function(t,n,e){},25:function(t,n,e){},27:function(t,n,e){"use strict";e.r(n);var a=e(0),o=e.n(a),i=e(12),r=e.n(i),s=(e(23),e(30)),l=e(31),h=e(33),g=e(32),c=e(16),m=e(17),v=e(13),u=new(e(24));function d(t,n,e,a){return u.convertUtmToLatLng(t,n,e,a)}function p(t,n){return y({lat:t,lon:n})}function f(t){var n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:1;return Object(v.a)(t,n)}function y(t){var n,e,a,o,i,r,s,l=t.lat,h=t.lon||t.lng,g=6378137,c=.00669438,m=.9996,v=x(l),u=x(h);s=Math.floor((h+180)/6)+1,180===h&&(s=60),l>=56&&l<64&&h>=3&&h<12&&(s=32),l>=72&&l<84&&(h>=0&&h<9?s=31:h>=9&&h<21?s=33:h>=21&&h<33?s=35:h>=33&&h<42&&(s=37)),r=x(6*(s-1)-180+3),n=.006739496752268451,e=g/Math.sqrt(1-c*Math.sin(v)*Math.sin(v)),a=Math.tan(v)*Math.tan(v),o=n*Math.cos(v)*Math.cos(v);var d=m*e*((i=Math.cos(v)*(u-r))+(1-a+o)*i*i*i/6+(5-18*a+a*a+72*o-58*n)*i*i*i*i*i/120)+5e5,p=m*(g*(.9983242984503243*v-.002514607064228144*Math.sin(2*v)+2639046602129982e-21*Math.sin(4*v)-3.418046101696858e-9*Math.sin(6*v))+e*Math.tan(v)*(i*i/2+(5-a+9*o+4*o*o)*i*i*i*i/24+(61-58*a+a*a+600*o-2.2240339282485886)*i*i*i*i*i*i/720));return l<0&&(p+=1e7),{northing:Math.round(p),easting:Math.round(d),zoneNumber:s,zoneLetter:T(l)}}function x(t){return t*(Math.PI/180)}function T(t){var n="Z";return 84>=t&&t>=72?n="X":72>t&&t>=64?n="W":64>t&&t>=56?n="V":56>t&&t>=48?n="U":48>t&&t>=40?n="T":40>t&&t>=32?n="S":32>t&&t>=24?n="R":24>t&&t>=16?n="Q":16>t&&t>=8?n="P":8>t&&t>=0?n="N":0>t&&t>=-8?n="M":-8>t&&t>=-16?n="L":-16>t&&t>=-24?n="K":-24>t&&t>=-32?n="J":-32>t&&t>=-40?n="H":-40>t&&t>=-48?n="G":-48>t&&t>=-56?n="F":-56>t&&t>=-64?n="E":-64>t&&t>=-72?n="D":-72>t&&t>=-80&&(n="C"),n}e(4);var C=e(29),b=e(7),w=/([0-9]+[A-Z])([A-Z]{2})([0-9]{2})/;function P(t,n){return t===n?0:t.lng===n.lng?NaN:(n.lat-t.lat)/(n.lng-t.lng)}function j(t,n,e){return isNaN(t)?e.lat:e.lat+t*(n-e.lng)}function G(t,n,e){if(0===t)throw new Error("getAdjustedLongitude: Zero slope received");return isNaN(t)?e.lng:(n-e.lat+t*e.lng)/t}function I(t){var n=String.fromCharCode(t.charCodeAt(0)+1);return"I"===n||"O"===n?I(n):n}function M(t,n,e){var a,o,i=P(t,n),r=Object(v.a)([t.lng,t.lat],1);switch(e){case"East":var s=Object(b.getGZD)(r.match(w)[1]).geometry.coordinates[0][2][0];return{lat:o=j(i,s,n),lng:a=s};case"West":var l=Object(b.getGZD)(r.match(w)[1]).geometry.coordinates[0][1][0];return{lat:o=j(i,l,n),lng:a=l};case"North":var h=Object(b.getGZD)(r.match(w)[1]).geometry.coordinates[0][1][1];a=G(i,h,n);return"31V"===r.match(w)[1]&&a<3&&n.lng>3?(o=j(i,3,n),a=3):o=h,{lat:o,lng:a};case"South":var g=Object(b.getGZD)(r.match(w)[1]).geometry.coordinates[0][0][1];return{lat:o=g,lng:a=G(i,g,n)};default:return{lat:o,lng:a}}}function S(t,n,e,a,o){var i=t.measureText(n).width,r=t.measureText(n).fontBoundingBoxAscent,s=o.x,l=o.y;t.fillStyle=a,t.fillRect(s-i/2-1,l-r+1,i+3,r+2),t.fillStyle=e,t.fillText(n,s-i/2,l)}var k=/([0-9]+[A-Z])([A-Z]{2})(\d+)/,O=function(){var t=Object(C.a)();new Z(t);return null},Z=function(){function t(n){Object(c.a)(this,t),this.currLatInterval=8,this.currLngInterval=6,this.defaultOptions={showGrid:!0,showLabel:!0,opacity:10,color:"#888888",font:"14px Courier New",fontColor:"#FFF",dashArray:[6,6],gzdMinZoom:3,weight:1.5,gridColor:"#000",hkColor:"#990000",hkDashArray:[4,4],gridFont:"14px Courier New",gridFontColor:"#FFF",gridDashArray:[],hundredKMinZoom:6,tenKMinZoom:9,oneKMinZoom:12},this.options=this.defaultOptions,this.map=n,this.canvas=document.createElement("canvas"),this.canvas.classList.add("leaflet-zoom-animated"),this.map.getPanes().overlayPane.hasChildNodes()||this.map.getPanes().overlayPane.appendChild(this.canvas),this.map.on("viewreset",this.reset,this),this.map.on("move",this.reset,this),this.map.on("overlayadd",this.showGraticule,this),this.map.on("overlayremove",this.clearRect,this),this.reset()}return Object(m.a)(t,[{key:"clearRect",value:function(){this.canvas.getContext("2d").clearRect(0,0,this.canvas.width,this.canvas.height),this.options.showGrid=!1}},{key:"showGraticule",value:function(){this.options.showGrid=!0,this.reset()}},{key:"reset",value:function(){if(this.options.showGrid){var t=this.map.getSize(),n=this.map.containerPointToLayerPoint([0,0]);this.canvas.style.transform="translate3d(".concat(n.x,"px,").concat(n.y,"px,0)"),this.canvas.width=t.x,this.canvas.height=t.y,this.map.getZoom()>this.options.oneKMinZoom?this.mgrsGridInterval=1e3:this.map.getZoom()>this.options.tenKMinZoom?this.mgrsGridInterval=1e4:this.map.getZoom()>this.options.hundredKMinZoom?this.mgrsGridInterval=1e5:this.mgrsGridInterval=null;var e=this.canvas.getContext("2d");e.clearRect(0,0,this.canvas.width,this.canvas.height),this.drawGrid(e),this.drawGzd(e)}}},{key:"drawGzd",value:function(t){if(this.canvas&&this.map&&!(this.map.getZoom()<this.options.minZoom)){t.lineWidth=this.options.weight,t.strokeStyle=this.options.color,t.fillStyle=this.options.color,t.setLineDash(this.options.dashArray),this.options.font&&(t.font=this.options.font);var n=this.map.containerPointToLatLng({x:0,y:0}),e=this.map.containerPointToLatLng({x:this.canvas.width,y:this.canvas.height}),a=(n.lat-e.lat)/(.2*this.canvas.height),o=(e.lng-n.lng)/(.2*this.canvas.width);if(!isNaN(a)&&!isNaN(o)){a<1&&(a=1),o<1&&(o=1),e.lat<-90?e.lat=-90:e.lat=parseInt(e.lat-a,10),n.lat>90?n.lat=90:n.lat=parseInt(n.lat+a,10),n.lng>0&&e.lng<0&&(e.lng+=360),e.lng=parseInt(e.lng+o,10),n.lng=parseInt(n.lng-o,10);for(var i=this.currLatInterval;i<=n.lat;i+=this.currLatInterval)i>=e.lat&&(80===i&&(i=84),this.drawLatitudeLine(t,i,n.lng,e.lng));for(var r=0;r>=e.lat;r-=this.currLatInterval)r<=n.lat&&this.drawLatitudeLine(t,r,n.lng,e.lng);for(var s=-180;s<=e.lng+6;s+=this.currLngInterval)this.drawLongitudeLine(t,s,n.lat,e.lat)}}}},{key:"drawLatitudeLine",value:function(t,n,e,a){var o=this.map.latLngToContainerPoint({lat:n,lng:e}),i=this.map.latLngToContainerPoint({lat:n,lng:a});t.beginPath(),t.moveTo(o.x,o.y),t.lineTo(i.x,i.y),t.stroke()}},{key:"drawLongitudeLine",value:function(t,n,e,a){e>=84&&(e=84),a<=-80&&(a=-80);var o=this.map.latLngToContainerPoint({lat:e,lng:n}),i=this.map.latLngToContainerPoint({lat:a,lng:n}),r=72;if(t.beginPath(),6===n){var s=64,l=56,h=this.map.latLngToContainerPoint({lat:s,lng:n}),g=this.map.latLngToContainerPoint({lat:s,lng:3}),c=this.map.latLngToContainerPoint({lat:l,lng:3}),m=this.map.latLngToContainerPoint({lat:l,lng:n});if(e>s&&a>l){if(e>r){var v=this.map.latLngToContainerPoint({lat:r,lng:n});t.moveTo(v.x,v.y)}else t.moveTo(o.x,o.y);t.lineTo(h.x,h.y),t.moveTo(g.x,g.y),t.lineTo(g.x,i.y)}else if(e<s&&a<l)t.moveTo(g.x,o.y),t.lineTo(c.x,c.y),t.moveTo(m.x,m.y),t.lineTo(m.x,i.y);else if(e>=s&&a<=l){if(e>r){var u=this.map.latLngToContainerPoint({lat:r,lng:n});t.moveTo(u.x,u.y)}else t.moveTo(o.x,o.y);t.lineTo(h.x,h.y),t.moveTo(g.x,g.y),t.lineTo(c.x,c.y),t.moveTo(h.x,c.y),t.lineTo(h.x,i.y)}else e<=s&&a>=l&&(t.moveTo(g.x,o.y),t.lineTo(c.x,i.y))}else if(12===n)if(e>r&&e<=84){var d=this.map.latLngToContainerPoint({lat:e,lng:9});t.moveTo(d.x,d.y);var p=this.map.latLngToContainerPoint({lat:r,lng:9});t.lineTo(p.x,p.y);var f=this.map.latLngToContainerPoint({lat:r,lng:n});t.moveTo(f.x,f.y),t.lineTo(i.x,i.y)}else t.moveTo(o.x,o.y),t.lineTo(i.x,i.y);else if(18===n){if(e>r){var y=this.map.latLngToContainerPoint({lat:r,lng:n});t.moveTo(y.x,y.y)}else t.moveTo(o.x,o.y);t.lineTo(i.x,i.y)}else if(24===n)if(e>r&&e<=84){var x=this.map.latLngToContainerPoint({lat:e,lng:21});t.moveTo(x.x,x.y);var T=this.map.latLngToContainerPoint({lat:r,lng:21});t.lineTo(T.x,T.y);var L=this.map.latLngToContainerPoint({lat:r,lng:n});t.moveTo(L.x,L.y),t.lineTo(i.x,i.y)}else t.moveTo(o.x,o.y),t.lineTo(i.x,i.y);else if(30===n){if(e>r){var C=this.map.latLngToContainerPoint({lat:r,lng:n});t.moveTo(C.x,C.y)}else t.moveTo(o.x,o.y);t.lineTo(i.x,i.y)}else if(36===n)if(e>r&&e<=84){var b=this.map.latLngToContainerPoint({lat:e,lng:33});t.moveTo(b.x,b.y);var w=this.map.latLngToContainerPoint({lat:r,lng:33});t.lineTo(w.x,w.y);var P=this.map.latLngToContainerPoint({lat:r,lng:n});t.moveTo(P.x,P.y),t.lineTo(i.x,i.y)}else t.moveTo(o.x,o.y),t.lineTo(i.x,i.y);else t.moveTo(o.x,o.y),t.lineTo(i.x,i.y);t.stroke(),this.drawGzdLabels(t,n)}},{key:"drawGzdLabels",value:function(t,n){for(var e=-76;e<84;e+=8){var a=void 0;a=60===e?0===n?1.5:6===n?7.5:n+3:76===e?0===n?4.5:12===n?15:24===n?27:36===n?37.5:n+3:n+3;var o=void 0;try{o=f([a,e],1).match(k)[1]}catch(r){return}if(("33X"!==o||6!==n)&&("35X"!==o||18!==n)&&("37X"!==o||30!==n)){var i=this.map.latLngToContainerPoint({lat:e,lng:a});S(t,o,this.options.fontColor,this.options.color,i)}}}},{key:"_getLabelText",value:function(t){var n=(t%1e5/1e3).toString();return 1e4===this.mgrsGridInterval&&"0"===n&&(n="00"),n}},{key:"_drawLine",value:function(t,n){n?(t.setLineDash(this.options.gridDashArray),t.lineWidth=this.options.weight+1,t.strokeStyle=this.options.gridFontColor,t.stroke(),t.lineWidth=this.options.weight,t.strokeStyle=this.options.gridColor,t.stroke()):(t.lineWidth=this.options.weight,t.strokeStyle=this.options.hkColor,t.setLineDash(this.options.hkDashArray),t.stroke())}},{key:"getVizGrids",value:function(){var t=f([this.map.getBounds().getNorthWest().lng,this.map.getBounds().getNorthWest().lat],1),n=f([this.map.getBounds().getNorthEast().lng,this.map.getBounds().getNorthEast().lat],1),e=f([this.map.getBounds().getSouthEast().lng,this.map.getBounds().getSouthEast().lat],1),a=f([this.map.getBounds().getSouthWest().lng,this.map.getBounds().getSouthWest().lat],1);return function(t,n,e,a){var o=/([0-9]+)([A-Z])/;if(t===e)return[t];var i=parseInt(t.match(o)[1]),r=t.match(o)[2],s=parseInt(n.match(o)[1]),l=a.match(o)[2],h=[],g=[];if("32V"===t&&g.push("31"),i!==s){for(var c=i;c<=s;c++)g.push(c.toString());if(r!==l){for(var m=[].concat(g),v=l;v<=r;){for(var u=m.length,d=0;d<u;d++)h.push(m[d]+v);v=I(v)}h=h.flat()}else{for(var p=g.length,f=0;f<p;f++)g[f]=g[f].toString()+r;h=g}}else{for(var y=l,x=[];y<=r;)x.push(i.toString()+y),y=I(y);h=x}return(h=h.filter((function(t){return"32X"!==t&&"34X"!==t&&"36X"!==t}))).includes("31W")&&!h.includes("32V")&&h.push("32V"),"32V"!==n||"32U"!==e||h.includes("31U")||h.push("31U"),h}(t.match(k)[1],n.match(k)[1],e.match(k)[1],a.match(k)[1])}},{key:"drawGrid",value:function(t){var n=this;if(this.canvas&&this.map&&!(this.map.getZoom()<this.options.hundredKMinZoom)){t.lineWidth=this.options.weight+.75,t.strokeStyle=this.options.gridFontColor,t.fillStyle=this.options.gridColor,t.setLineDash(this.options.dashArray),t.font=this.options.gridFont;var e=this.getVizGrids(),a=this.map.getBounds();e.forEach((function(e,o,i){var r;try{r=Object(b.getGZD)(e)}catch(A){return}var s=r.geometry.coordinates[0][1][0],l=r.geometry.coordinates[0][2][0],h=r.geometry.coordinates[0][1][1],g=r.geometry.coordinates[0][0][1],c=s<a.getWest()&&1e5!==n.mgrsGridInterval?a.getWest():s,m=l>a.getEast()&&1e5!==n.mgrsGridInterval?a.getEast():l,v=h>a.getNorth()?a.getNorth():h,u=g<a.getSouth()?a.getSouth():g,y=1e-5,x=p(u+y,c+y),T=p(u+y,m-y),C=p(v-y,c+y),w=p(v-y,m-y),G=n.map.getCenter().lat>=0?x.easting:C.easting,I=n.map.getCenter().lat>=0?T.easting:w.easting,O=x.northing>T.northing?T.northing:x.northing,Z=C.northing>w.northing?C.northing:w.northing;G=Math.floor(G/n.mgrsGridInterval)*n.mgrsGridInterval,I=Math.ceil(I/n.mgrsGridInterval)*n.mgrsGridInterval,O=Math.floor(O/n.mgrsGridInterval)*n.mgrsGridInterval,Z=Math.ceil(Z/n.mgrsGridInterval)*n.mgrsGridInterval;for(var N=[],E=G;E<=I;E+=n.mgrsGridInterval)N.push(E);for(var z=[],B=O;B<=Z;B+=n.mgrsGridInterval)z.push(B);var F=C.zoneLetter,W=C.zoneNumber;N.forEach((function(e,a,o){var i=!1;t.beginPath(),z.forEach((function(a,o,r){var c=d(e,a,W,F);if(!(c.lng>l)&&!(c.lng<s)){var m;if(c.lat<g)c=M(c,d(e,r[o+1],W,F),"North");else if(c.lat>h){c=M(c,d(e,r[o-1],W,F),"South")}Number.isFinite(c.lat)&&Number.isFinite(c.lng)&&(m=n.map.latLngToContainerPoint(c),i?t.lineTo(m.x,m.y):(t.moveTo(m.x,m.y),i=!0))}}));var r=e%1e5!==0;n._drawLine(t,r)})),z.forEach((function(e,a,o){var i=!1;N.forEach((function(a,o,r){var s=d(a,e,W,F);if(s.lat>h||s.lat<g)i||(t.beginPath(),i=!0);else{var l=n.map.latLngToContainerPoint(s);if(i){if(s.lng>m){var v=P(s,d(r[o-1],e,W,F));try{s.lat=j(v,m,s),s.lng=m,l=n.map.latLngToContainerPoint(s)}catch(A){console.error(A),console.trace()}}t.lineTo(l.x,l.y)}else{if(s.lng<c){var u=d(r[o+1],e,W,F);if(u.lng<c)return;var p=P(s,u);try{s.lat=j(p,c,s),s.lng=c,l=n.map.latLngToContainerPoint(s)}catch(A){console.error(A),console.trace()}}t.beginPath(),i=!0,t.moveTo(l.x,l.y)}}}));var r=e%1e5!==0;n._drawLine(t,r)})),1e5===n.mgrsGridInterval?N.forEach((function(e,a,o){z.forEach((function(i,r,s){var l,h,g,p=d(e,i,W,F);if(o[a+1]){if((g=d(o[a+1],i,W,F)).lng>m){var y=P(p,g);g.lat=j(y,m,g),g.lng=m}if(s[r+1]){if(h=d(0===a?o[a+1]:e,s[r+1],W,F),p.lng<c){var x=P(p,g);p.lat=j(x,c,p),p.lng=c}else if(p.lng>m)return;l={lat:(p.lat+h.lat)/2,lng:(p.lng+g.lng)/2};try{var T=L.latLngBounds(L.latLng(v,c),L.latLng(u,m));if(l&&T.contains(l)){var C=f([l.lng,l.lat]).match(k)[2];if(n.map.latLngToContainerPoint(L.latLng(p)).distanceTo(n.map.latLngToContainerPoint(L.latLng(g)))<2*t.measureText(C).width)return;S(t,C,n.options.gridFontColor,n.options.hkColor,n.map.latLngToContainerPoint(l))}}catch(A){return}}}}))})):(N.forEach((function(e,a,o){if(0!==a&&a!==o.length-1){var i;try{var r=d(e,z[1],W,F);i=n.map.latLngToContainerPoint({lat:u,lng:r.lng})}catch(A){return}var s=n._getLabelText(e);S(t,s,n.options.gridFontColor,n.options.gridColor,{x:i.x,y:i.y-15})}})),z.forEach((function(e,a,o){var i;try{var r=d(N[N.length-1],e,W,F);i=n.map.latLngToContainerPoint({lat:r.lat,lng:m})}catch(A){return}var s=n._getLabelText(e);S(t,s,n.options.gridFontColor,n.options.gridColor,{x:i.x-15,y:i.y})})))}))}}}]),t}(),N=(e(25),e(1));var E=function(){return Object(N.jsx)(s.a,{center:[45.4,-75.7],zoom:7,minZoom:3,maxZoom:16,maxNativeZoom:15,maxBounds:[[-90,-180],[90,180]],children:Object(N.jsxs)(l.a,{position:"topright",children:[Object(N.jsx)(l.a.BaseLayer,{checked:!0,name:"ESRI Satellite",children:Object(N.jsx)(h.a,{url:"https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",attribution:'\xa9 <a href="https://wiki.openstreetmap.org/wiki/Esri"></a> contributors'})}),Object(N.jsx)(l.a.BaseLayer,{name:"ESRI Clarity",children:Object(N.jsx)(h.a,{url:"https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",attribution:'\xa9 <a href="https://wiki.openstreetmap.org/wiki/Esri"></a> contributors'})}),Object(N.jsx)(l.a.BaseLayer,{name:"OSM Topo",children:Object(N.jsx)(h.a,{url:"https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",attribution:'\xa9 <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'})}),Object(N.jsx)(l.a.BaseLayer,{name:"OSM Topo",children:Object(N.jsx)(h.a,{url:"https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",attribution:"OSM"})}),Object(N.jsx)(l.a.Overlay,{checked:!0,name:"MGRS graticule",children:Object(N.jsx)(g.a,{children:Object(N.jsx)(O,{})})})]})})};r.a.render(Object(N.jsx)(o.a.StrictMode,{children:Object(N.jsx)(E,{})}),document.getElementById("root"))}},[[27,1,2]]]);
//# sourceMappingURL=main.1bd5ed28.chunk.js.map