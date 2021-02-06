(this["webpackJsonpreact-leaflet-mgrs-graticule-example"]=this["webpackJsonpreact-leaflet-mgrs-graticule-example"]||[]).push([[0],{26:function(t,e,a){},28:function(t,e,a){},33:function(t,e,a){"use strict";a.r(e);var n=a(11),o=a.n(n),r=a(19),i=a.n(r),s=(a(26),a(35)),l=a(36),h=a(6),g=a(7),c=a(10),m=a(9),v=a(4),u=a(34),p=a(1),f=a(2),d=/([0-9]+[A-Z])([A-Z]{2})([0-9]{2})/;function y(t,e){return t===e?0:t.lng===e.lng?NaN:(e.lat-t.lat)/(e.lng-t.lng)}function L(t,e,a){return isNaN(t)?a.lat:a.lat+t*(e-a.lng)}function b(t,e,a){if(0===t)throw new Error("getAdjustedLongitude: Zero slope received");return isNaN(t)?a.lng:(e-a.lat+t*a.lng)/t}function x(t){var e=String.fromCharCode(t.charCodeAt(0)+1);return"I"===e||"O"===e?x(e):e}function T(t,e){var a=t.project(e);return a._subtract(t.getPixelOrigin()),a._add(t._getMapPanePos()),a}function N(t,e,a){var n,o,r=y(t,e),i=Object(p.a)([t.lng,t.lat],1);switch(a){case"East":var s=Object(f.getGZD)(i.match(d)[1]).geometry.coordinates[0][2][0];return{lat:o=L(r,s,e),lng:n=s};case"West":var l=Object(f.getGZD)(i.match(d)[1]).geometry.coordinates[0][1][0];return{lat:o=L(r,l,e),lng:n=l};case"North":var h=Object(f.getGZD)(i.match(d)[1]).geometry.coordinates[0][1][1];n=b(r,h,e);return"31V"===i.match(d)[1]&&n<3&&e.lng>3?(o=L(r,3,e),n=3):o=h,{lat:o,lng:n};case"South":var g=Object(f.getGZD)(i.match(d)[1]).geometry.coordinates[0][0][1];return{lat:o=g,lng:n=b(r,g,e)};default:return{lat:o,lng:n}}}function j(t,e,a,n){var o=/([0-9]+)([A-Z])/;if(t===a)return[t];var r=parseInt(t.match(o)[1]),i=t.match(o)[2],s=parseInt(e.match(o)[1]),l=n.match(o)[2],h=[],g=[];if("32V"===t&&g.push("31"),r!==s){for(var c=r;c<=s;c++)g.push(c.toString());if(i!==l){for(var m=[].concat(g),v=l;v<=i;){for(var u=m.length,p=0;p<u;p++)h.push(m[p]+v);v=x(v)}h=h.flat()}else{for(var f=g.length,d=0;d<f;d++)g[d]=g[d].toString()+i;h=g}}else{for(var y=l,L=[];y<=i;)L.push(r.toString()+y),y=x(y);h=L}return(h=h.filter((function(t){return"32X"!==t&&"34X"!==t&&"36X"!==t}))).includes("31W")&&!h.includes("32V")&&h.push("32V"),"32V"!==e||"32U"!==a||h.includes("31U")||h.push("31U"),h}function w(t,e,a,n,o){var r=t.measureText(e).width,i=t.measureText(e).fontBoundingBoxAscent,s=o.x,l=o.y;t.fillStyle=n,t.fillRect(s-r/2-1,l-i+1,r+3,i+2),t.fillStyle=a,t.fillText(e,s-r/2,l)}var O=/([0-9]+[A-Z])([A-Z]{2})(\d+)/,E=function(t){var e=Object(u.a)(),a=document.createElement("canvas");a.classList.add("leaflet-zoom-animated");var n=new z({map:e,canvas:a});return e.addLayer(n),null},z=function(t){Object(c.a)(a,t);var e=Object(m.a)(a);function a(t){var n;return Object(h.a)(this,a),(n=e.call(this,t)).currLatInterval=8,n.currLngInterval=6,n.defaultOptions={showGrid:!0,showLabel:!0,opacity:10,weight:3,color:"#888888",font:"14px Courier New",fontColor:"#FFF",dashArray:[6,6],minZoom:3},n.map=t.map,n.canvas=t.canvas,n.options=t&&t.options||n.defaultOptions,n}return Object(g.a)(a,[{key:"onAdd",value:function(t){t._panes.overlayPane.appendChild(this.canvas),t.on("viewreset",this.reset,this),t.on("move",this.reset,this),this.reset()}},{key:"onRemove",value:function(t){t._panes.overlayPane.removeChild(this.canvas),t.off("viewreset",this.reset,this),t.off("move",this.reset,this),this.canvas=null,this.map=null}},{key:"reset",value:function(){var t=this.map.getSize(),e=this.map.containerPointToLayerPoint([0,0]);this.canvas._leaflet_pos=e,this.canvas.style.transform="translate3d(".concat(e.x,"px,").concat(e.y,"px,0)"),this.canvas.width=t.x,this.canvas.height=t.y,this.drawGzd()}},{key:"drawGzd",value:function(){if(this.canvas&&this.map&&!(this.map.getZoom()<this.options.minZoom)){var t=this.canvas.getContext("2d");t.clearRect(0,0,this.canvas.width,this.canvas.height),t.lineWidth=this.options.weight,t.strokeStyle=this.options.color,t.fillStyle=this.options.color,t.setLineDash(this.options.dashArray),this.options.font&&(t.font=this.options.font);var e=this.map.containerPointToLatLng({x:0,y:0}),a=this.map.containerPointToLatLng({x:this.canvas.width,y:this.canvas.height}),n=(e.lat-a.lat)/(.2*this.canvas.height),o=(a.lng-e.lng)/(.2*this.canvas.width);if(!isNaN(n)&&!isNaN(o)){n<1&&(n=1),o<1&&(o=1),a.lat<-90?a.lat=-90:a.lat=parseInt(a.lat-n,10),e.lat>90?e.lat=90:e.lat=parseInt(e.lat+n,10),e.lng>0&&a.lng<0&&(a.lng+=360),a.lng=parseInt(a.lng+o,10),e.lng=parseInt(e.lng-o,10);for(var r=this.currLatInterval;r<=e.lat;r+=this.currLatInterval)r>=a.lat&&(80===r&&(r=84),this.drawLatitudeLine(t,r,e.lng,a.lng));for(var i=0;i>=a.lat;i-=this.currLatInterval)i<=e.lat&&this.drawLatitudeLine(t,i,e.lng,a.lng);for(var s=this.currLngInterval;s<=a.lng+6;s+=this.currLngInterval)s>=e.lng&&this.drawLongitudeLine(t,s,e.lat,a.lat);for(var l=0;l>=e.lng;l-=this.currLngInterval)l<=a.lng&&this.drawLongitudeLine(t,l,e.lat,a.lat)}}}},{key:"drawLatitudeLine",value:function(t,e,a,n){var o=T(this.map,{lat:e,lng:a}),r=T(this.map,{lat:e,lng:n});t.beginPath(),t.moveTo(o.x,o.y),t.lineTo(r.x,r.y),t.stroke()}},{key:"drawLongitudeLine",value:function(t,e,a,n){a>=84&&(a=84),n<=-80&&(n=-80);var o=T(this.map,{lat:a,lng:e}),r=T(this.map,{lat:n,lng:e}),i=72;if(t.beginPath(),6===e){var s=64,l=56,h=T(this.map,{lat:s,lng:e}),g=T(this.map,{lat:s,lng:3}),c=T(this.map,{lat:l,lng:3}),m=T(this.map,{lat:l,lng:e});if(a>s&&n>l){if(a>i){var v=T(this.map,{lat:i,lng:e});t.moveTo(v.x,v.y)}else t.moveTo(o.x,o.y);t.lineTo(h.x,h.y),t.moveTo(g.x,g.y),t.lineTo(g.x,r.y)}else if(a<s&&n<l)t.moveTo(g.x,o.y),t.lineTo(c.x,c.y),t.moveTo(m.x,m.y),t.lineTo(m.x,r.y);else if(a>=s&&n<=l){if(a>i){var u=T(this.map,{lat:i,lng:e});t.moveTo(u.x,u.y)}else t.moveTo(o.x,o.y);t.lineTo(h.x,h.y),t.moveTo(g.x,g.y),t.lineTo(c.x,c.y),t.moveTo(h.x,c.y),t.lineTo(h.x,r.y)}else a<=s&&n>=l&&(t.moveTo(g.x,o.y),t.lineTo(c.x,r.y))}else if(12===e)if(a>i&&a<=84){var p=T(this.map,{lat:a,lng:9});t.moveTo(p.x,p.y);var f=T(this.map,{lat:i,lng:9});t.lineTo(f.x,f.y);var d=T(this.map,{lat:i,lng:e});t.moveTo(d.x,d.y),t.lineTo(r.x,r.y)}else t.moveTo(o.x,o.y),t.lineTo(r.x,r.y);else if(18===e){if(a>i){var y=T(this.map,{lat:i,lng:e});t.moveTo(y.x,y.y)}else t.moveTo(o.x,o.y);t.lineTo(r.x,r.y)}else if(24===e)if(a>i&&a<=84){var L=T(this.map,{lat:a,lng:21});t.moveTo(L.x,L.y);var b=T(this.map,{lat:i,lng:21});t.lineTo(b.x,b.y);var x=T(this.map,{lat:i,lng:e});t.moveTo(x.x,x.y),t.lineTo(r.x,r.y)}else t.moveTo(o.x,o.y),t.lineTo(r.x,r.y);else if(30===e){if(a>i){var N=T(this.map,{lat:i,lng:e});t.moveTo(N.x,N.y)}else t.moveTo(o.x,o.y);t.lineTo(r.x,r.y)}else if(36===e)if(a>i&&a<=84){var j=T(this.map,{lat:a,lng:33});t.moveTo(j.x,j.y);var w=T(this.map,{lat:i,lng:33});t.lineTo(w.x,w.y);var O=T(this.map,{lat:i,lng:e});t.moveTo(O.x,O.y),t.lineTo(r.x,r.y)}else t.moveTo(o.x,o.y),t.lineTo(r.x,r.y);else t.moveTo(o.x,o.y),t.lineTo(r.x,r.y);t.stroke(),this.drawGzdLabels(t,e)}},{key:"drawGzdLabels",value:function(t,e){for(var a=-76;a<84;a+=8){var n=void 0;n=60===a?0===e?1.5:6===e?7.5:e+3:76===a?0===e?4.5:12===e?15:24===e?27:36===e?37.5:e+3:e+3;var o=void 0;try{o=Object(p.a)([n,a],1).match(O)[1]}catch(i){return}if(("33X"!==o||6!==e)&&("35X"!==o||18!==e)&&("37X"!==o||30!==e)){var r=T(this.map,{lat:a,lng:n});w(t,o,this.options.fontColor,this.options.color,r)}}}}]),a}(v.Layer),Z=a(8),G=/([0-9]+[A-Z])([A-Z]{2})(\d+)/,I=new(a(18)),A=function(t){var e=Object(u.a)(),a=document.createElement("canvas");a.classList.add("leaflet-zoom-animated");var n=new k({map:e,canvas:a});return e.addLayer(n),null},k=function(t){Object(c.a)(a,t);var e=Object(m.a)(a);function a(t){var n;return Object(h.a)(this,a),(n=e.call(this,t)).updateVariables=n.updateVariables.bind(Object(Z.a)(n)),n.defaultOptions={showGrid:!0,showLabel:!0,opacity:10,weight:2,color:"#990000",font:"15px Courier New",fontColor:"#FFFFFF",dashArray:[4,4],eastingArray:[],northingArray:[],minZoom:6,maxZoom:10},n.options=t&&t.options||n.defaultOptions,n.map=t.map,n.canvas=t.canvas,n.northingArray=[],n.eastingArray=[],n.HUNDRED_K_GRID_INTERVAL=1e5,n}return Object(g.a)(a,[{key:"updateVariables",value:function(t){this.options=t&&t.options||this.defaultOptions}},{key:"onAdd",value:function(t){t._panes.overlayPane.appendChild(this.canvas),t.on("viewreset",this.reset,this),t.on("move",this.reset,this),this.reset()}},{key:"onRemove",value:function(t){t._panes.overlayPane.removeChild(this.canvas),t.off("viewreset",this.reset,this),t.off("move",this.reset,this),this.canvas=null,this.map=null}},{key:"reset",value:function(){var t=this.map.getSize(),e=this.map.containerPointToLayerPoint([0,0]);this.canvas._leaflet_pos=e,this.canvas.style.transform="translate3d(".concat(e.x,"px,").concat(e.y,"px,0)"),this.canvas.width=t.x,this.canvas.height=t.y;var a=this.map.getZoom();if(a>this.options.minZoom&&a<this.options.maxZoom){var n=this.getVizGrids();this.eastingArray=[],this.northingArray=[],this.generateGrids(n)}}},{key:"getVizGrids",value:function(){var t=Object(p.a)([this.map.getBounds().getNorthWest().lng,this.map.getBounds().getNorthWest().lat],1),e=Object(p.a)([this.map.getBounds().getNorthEast().lng,this.map.getBounds().getNorthEast().lat],1),a=Object(p.a)([this.map.getBounds().getSouthEast().lng,this.map.getBounds().getSouthEast().lat],1),n=Object(p.a)([this.map.getBounds().getSouthWest().lng,this.map.getBounds().getSouthWest().lat],1);return j(t.match(G)[1],e.match(G)[1],a.match(G)[1],n.match(G)[1])}},{key:"getPaddingOnZoomLevel",value:function(t){switch(t){case 17:case 16:case 15:return 60;case 14:return 30;case 13:return 15;case 12:return 7;case 11:return 4;case 10:case 9:case 8:case 7:return 3;case 6:default:return 1}}},{key:"handle31VLabels",value:function(t,e,a){var n=T(this.map,{lat:(e.lat+a.lat)/2+.5,lng:(e.lng+a.lng)/2});w(t,Object(p.a)([(e.lng+a.lng)/2,(e.lat+a.lat)/2+.5]).match(G)[2],this.options.fontColor,this.options.color,n)}},{key:"handle31V",value:function(t,e,a){var n=Object(f.getGZD)("31V"),o=n.geometry.coordinates[0][1][0],r=n.geometry.coordinates[0][2][0],i=I.convertUtmToLatLng(e.easting+6e4,e.northing,e.zoneNumber,e.zoneLetter),s=y(a,i),l=L(s,r,i),h=T(this.map,{lat:l,lng:r}),g=L(s,o,i),c=T(this.map,{lat:g,lng:o});t.moveTo(c.x,c.y),t.lineTo(h.x,h.y),this.handle31VLabels(t,{lat:l,lng:r},a),this.handle31VLabels(t,{lat:g,lng:o},a)}},{key:"processEastingsAndNorthings",value:function(t,e,a,n){var o=t.Northing,r=e.Easting;if(o=Math.ceil(o/this.HUNDRED_K_GRID_INTERVAL)*this.HUNDRED_K_GRID_INTERVAL,r=Math.ceil(r/this.HUNDRED_K_GRID_INTERVAL)*this.HUNDRED_K_GRID_INTERVAL,t.ZoneNumber+t.ZoneLetter.toString()==="31W"&&(o=71e5),t.ZoneLetter===a.ZoneLetter)for(;o<=a.Northing;)o%this.HUNDRED_K_GRID_INTERVAL===0&&this.northingArray.push({northing:o,zoneNumber:t.ZoneNumber,zoneLetter:t.ZoneLetter}),o+=this.HUNDRED_K_GRID_INTERVAL;if(e.ZoneLetter===n.ZoneLetter)for(;r<=n.Easting;)r%this.HUNDRED_K_GRID_INTERVAL===0&&this.eastingArray.push({easting:r,zoneNumber:e.ZoneNumber,zoneLetter:e.ZoneLetter}),r+=this.HUNDRED_K_GRID_INTERVAL}},{key:"processGridIntersection",value:function(t,e,a){if(e.zoneNumber===a.zoneNumber&&e.zoneLetter===a.zoneLetter){var n={northing:a.northing,easting:e.easting,zoneNumber:a.zoneNumber,zoneLetter:a.zoneLetter};if(t.contains(I.convertUtmToLatLng(n.easting,n.northing,n.zoneNumber,n.zoneLetter)))return n}}},{key:"handleEquatorLabels",value:function(t,e,a){var n=I.convertUtmToLatLng(Math.floor((e.easting+a.easting)/2),Math.floor(e.northing-5e4),e.zoneNumber,e.zoneLetter);w(t,Object(p.a)([n.lng,n.lat]).match(G)[2],this.options.fontColor,this.options.color,T(this.map,{lat:n.lat,lng:n.lng}))}},{key:"generateGrids",value:function(t){var e=this,a=this.canvas.getContext("2d");a.clearRect(0,0,this.canvas.width,this.canvas.height),a.lineWidth=this.options.weight,a.strokeStyle=this.options.color,a.fillStyle=this.options.color,a.setLineDash(this.options.dashArray),a.font=this.options.font,t.forEach((function(t){var a;try{a=Object(f.getGZD)(t)}catch(m){return}var n=a.geometry.coordinates[0][0],o=a.geometry.coordinates[0][1],r=a.geometry.coordinates[0][2],i=a.geometry.coordinates[0][3],s=1e-5,l=I.convertLatLngToUtm(n[1]+s,n[0]+s,0),h=I.convertLatLngToUtm(o[1]-s,o[0]+s,0),g=I.convertLatLngToUtm(r[1]-s,r[0]-s,0),c=I.convertLatLngToUtm(i[1]+s,i[0]-s,0);switch("33V"===t&&(l={ZoneLetter:"V",ZoneNumber:33,Easting:312900,Northing:6210142}),e.map.getCenter().lat<=0?"South":"North"){case"North":e.processEastingsAndNorthings(l,l,g,c);break;case"South":e.processEastingsAndNorthings(l,h,g,g)}}));var n=this.map.getBounds().pad(this.getPaddingOnZoomLevel(this.map.getZoom()));this.northingArray.forEach((function(t){var o=[];e.eastingArray.forEach((function(a){var r=e.processGridIntersection(n,a,t);r&&o.push(r)})),o.forEach((function(t,n,r){var i=I.convertUtmToLatLng(t.easting,t.northing,t.zoneNumber,t.zoneLetter),s=T(e.map,{lat:i.lat,lng:i.lng}),l=t.zoneNumber.toString()+t.zoneLetter;if("31V"===l)e.handle31V(a,t,i);else if(0===n){if(o[n+1]){var h=I.convertUtmToLatLng(o[n+1].easting,o[n+1].northing,o[n+1].zoneNumber,o[n+1].zoneLetter),g=Object(f.getGZD)(l).geometry.coordinates[0][1][0];if(i.lng<g){var c=L(y(i,h),g,h);s=T(e.map,{lat:c,lng:g})}else if(i.lng>g){var m=N(i,h,"West"),v=s;s=T(e.map,{lat:m.lat,lng:m.lng});var u=Object(p.a)([m.lng,m.lat]).match(G)[2],d=a.measureText(u).width;Math.abs(v.x-s.x)/1.5>d&&w(a,u,e.options.fontColor,e.options.color,T(e.map,{lat:Math.abs(m.lng-i.lng)/2+m.lat,lng:(m.lng+i.lng)/2})),"LT"===u&&"32W"===l&&(u=Object(p.a)([(m.lng+i.lng)/2,Math.abs(m.lng-i.lng)/2-m.lat]).match(G)[2],d=a.measureText(u).width,Math.abs(v.x-s.x)/1.5>d&&w(a,u,e.options.fontColor,e.options.color,T(e.map,{lat:m.lat-Math.abs(m.lng-i.lng)/2,lng:(m.lng+i.lng)/2})))}var b=I.convertUtmToLatLng(Math.floor((o[n].easting+o[n+1].easting)/2),Math.floor(o[n].northing+5e4),o[n].zoneNumber,o[n].zoneLetter),x=Object(p.a)([b.lng,b.lat]).match(G)[2];"EM"===x&&"32V"===l||w(a,x,e.options.fontColor,e.options.color,T(e.map,{lat:b.lat,lng:b.lng})),"N"===t.zoneLetter&&e.handleEquatorLabels(a,o[n],o[n+1])}a.beginPath(),a.moveTo(s.x,s.y)}else{if(n===r.length-1){var j=Object(f.getGZD)(l).geometry.coordinates[0][2][0],O=I.convertUtmToLatLng(o[n-1].easting,o[n-1].northing,o[n-1].zoneNumber,o[n-1].zoneLetter);if(i.lng>j){var E=L(y(i,O),j,O);s=T(e.map,{lat:E,lng:j})}else if(i.lng<=j){var z=N(i,O,"East"),Z=s;s=T(e.map,{lat:z.lat,lng:z.lng});var A=Object(p.a)([i.lng,i.lat]).match(G)[2],k=a.measureText(A).width;Math.abs(Z.x-s.x)/1.5>k&&w(a,A,e.options.fontColor,e.options.color,T(e.map,{lat:Math.abs(z.lng-i.lng)/2+z.lat,lng:(z.lng+i.lng)/2}))}var _=I.convertUtmToLatLng(Math.floor((o[n].easting+o[n-1].easting)/2),Math.floor(o[n].northing+5e4),o[n].zoneNumber,o[n].zoneLetter),D=Object(p.a)([_.lng,_.lat]).match(G)[2];w(a,D,e.options.fontColor,e.options.color,T(e.map,{lat:_.lat,lng:_.lng}))}else{var U=I.convertUtmToLatLng(Math.floor((o[n].easting+o[n+1].easting)/2),Math.floor(o[n].northing+5e4),o[n].zoneNumber,o[n].zoneLetter),S=Object(p.a)([U.lng,U.lat]).match(G)[2];"FM"===S&&"32V"===l||w(a,S,e.options.fontColor,e.options.color,T(e.map,{lat:U.lat,lng:U.lng})),"N"===t.zoneLetter&&e.handleEquatorLabels(a,o[n],o[n+1])}a.lineTo(s.x,s.y)}})),a.stroke()})),this.eastingArray.forEach((function(t){var o=[];e.northingArray.forEach((function(a){var r=e.processGridIntersection(n,t,a);r&&o.push(r)}));var r=!1;o.forEach((function(t,n,i){if(!r){var s=I.convertUtmToLatLng(t.easting,t.northing,t.zoneNumber,t.zoneLetter),l=T(e.map,{lat:s.lat,lng:s.lng}),h=t.zoneNumber.toString()+t.zoneLetter,g=Object(f.getGZD)(h).geometry.coordinates[0][0];if(0===n){if(a.beginPath(),s.lat>g[1]&&o[n+1]){var c=N(s,I.convertUtmToLatLng(o[n+1].easting,o[n+1].northing,o[n+1].zoneNumber,o[n+1].zoneLetter),"South");l=T(e.map,{lat:c.lat,lng:c.lng})}a.moveTo(l.x,l.y)}else{var m=Object(f.getGZD)(h).geometry.coordinates[0][2],v=I.convertUtmToLatLng(o[n-1].easting,o[n-1].northing,o[n-1].zoneNumber,o[n-1].zoneLetter),u=y(s,v);if(s.lng<=g[0]?(l=e.getAdjustedXy(u,g[0],v),r=!0):s.lng>m[0]&&(l=e.getAdjustedXy(u,m[0],v),r=!0),a.lineTo(l.x,l.y),i.length-1===n&&s.lat<m[1]){var p=N(s,v,"North");l=T(e.map,{lat:p.lat,lng:p.lng}),a.lineTo(l.x,l.y)}}}})),a.stroke()}))}},{key:"getAdjustedXy",value:function(t,e,a){var n=L(t,e,a);return T(this.map,{lat:n,lng:e})}}]),a}(v.Layer),_=/([0-9]+[A-Z])([A-Z]{2})(\d+)/,D=new(a(18)),U=function(t){var e=Object(u.a)(),a=document.createElement("canvas");a.classList.add("leaflet-zoom-animated");var n=new S({map:e,canvas:a});return e.addLayer(n),null},S=function(t){Object(c.a)(a,t);var e=Object(m.a)(a);function a(t){var n;return Object(h.a)(this,a),(n=e.call(this,t)).updateVariables=n.updateVariables.bind(Object(Z.a)(n)),n.defaultOptions={showGrid:!0,showLabel:!0,opacity:10,weight:1.5,color:"#000",hkColor:"#990000",hkDashArray:[4,4],font:"14px Courier New",fontColor:"#FFF",dashArray:[],tenKMinZoom:9,oneKMinZoom:12,eastingBottom:!0,NorthingRight:!0},n.options=t&&t.options||n.defaultOptions,n.map=t.map,n.canvas=t.canvas,n.currZoom=null,n.mgrsGridInterval=null,n}return Object(g.a)(a,[{key:"updateVariables",value:function(t){this.options=t&&t.options||this.defaultOptions}},{key:"onAdd",value:function(t){t._panes.overlayPane.appendChild(this.canvas),t.on("viewreset",this.reset,this),t.on("move",this.reset,this),this.reset()}},{key:"onRemove",value:function(t){t._panes.overlayPane.removeChild(this.canvas),t.off("viewreset",this.reset,this),t.off("move",this.reset,this),this.canvas=null,this.map=null}},{key:"reset",value:function(){var t=this.map.getSize(),e=this.map.containerPointToLayerPoint([0,0]);this.canvas._leaflet_pos=e,this.canvas.style.transform="translate3d(".concat(e.x,"px,").concat(e.y,"px,0)"),this.canvas.width=t.x,this.canvas.height=t.y,this.map.getZoom()>this.options.oneKMinZoom?this.mgrsGridInterval=1e3:this.map.getZoom()>this.options.tenKMinZoom?this.mgrsGridInterval=1e4:this.mgrsGridInterval=null,this.drawGrid()}},{key:"_getLabelText",value:function(t){var e=(t%1e5/1e3).toString();return 1e4===this.mgrsGridInterval&&"0"===e&&(e="00"),e}},{key:"_drawLine",value:function(t,e){e?(t.setLineDash(this.options.dashArray),t.lineWidth=this.options.weight+1,t.strokeStyle=this.options.fontColor,t.stroke(),t.lineWidth=this.options.weight,t.strokeStyle=this.options.color,t.stroke()):(t.lineWidth=this.options.weight,t.strokeStyle=this.options.hkColor,t.setLineDash(this.options.hkDashArray),t.stroke())}},{key:"getVizGrids",value:function(){var t=Object(p.a)([this.map.getBounds().getNorthWest().lng,this.map.getBounds().getNorthWest().lat],1),e=Object(p.a)([this.map.getBounds().getNorthEast().lng,this.map.getBounds().getNorthEast().lat],1),a=Object(p.a)([this.map.getBounds().getSouthEast().lng,this.map.getBounds().getSouthEast().lat],1),n=Object(p.a)([this.map.getBounds().getSouthWest().lng,this.map.getBounds().getSouthWest().lat],1);return j(t.match(_)[1],e.match(_)[1],a.match(_)[1],n.match(_)[1])}},{key:"drawGrid",value:function(){var t=this;if(this.canvas&&this.map&&!(this.map.getZoom()<this.options.tenKMinZoom)){var e=this.canvas.getContext("2d");e.clearRect(0,0,this.canvas.width,this.canvas.height),e.lineWidth=this.options.weight+.75,e.strokeStyle="#FFF",e.fillStyle=this.options.color,e.setLineDash(this.options.dashArray),e.font=this.options.font;var a=this.getVizGrids(),n=this.map.getBounds();a.forEach((function(a,o,r){var i=Object(f.getGZD)(a),s=i.geometry.coordinates[0][1][0],l=i.geometry.coordinates[0][2][0],h=i.geometry.coordinates[0][1][1],g=i.geometry.coordinates[0][0][1],c=s<n.getWest()?n.getWest():s,m=l>n.getEast()?n.getEast():l,v=h>n.getNorth()?n.getNorth():h,u=g<n.getSouth()?n.getSouth():g,p=1e-5,d=D.convertLatLngToUtm(u+p,c+p,0),y=D.convertLatLngToUtm(u+p,m-p,0),L=D.convertLatLngToUtm(v-p,c+p,0),b=D.convertLatLngToUtm(v-p,m-p,0),x=d.Easting,j=y.Easting,O=d.Northing,E=b.Northing;x=Math.floor(x/t.mgrsGridInterval)*t.mgrsGridInterval,j=Math.floor(j/t.mgrsGridInterval)*t.mgrsGridInterval,O=Math.floor(O/t.mgrsGridInterval)*t.mgrsGridInterval,E=Math.ceil(E/t.mgrsGridInterval)*t.mgrsGridInterval;for(var z=[],Z=x;Z<=j;Z+=t.mgrsGridInterval)z.push(Z);for(var G=[],I=O;I<=E;I+=t.mgrsGridInterval)G.push(I);var A=L.ZoneLetter,k=L.ZoneNumber;z.forEach((function(a,n,o){var r=!1;G.forEach((function(n,o,i){if(!r){var c=D.convertUtmToLatLng(a,n,k,A);if(!(c.lng<s||c.lng>l)){var m;if(c.lat<g)c=N(c,D.convertUtmToLatLng(a,i[o+1],k,A),"North");if(c)if(m=T(t.map,c),0===o)e.beginPath(),e.moveTo(m.x,m.y);else{if(c.lng>l&&(r=!0),c.lat>h)c=N(c,D.convertUtmToLatLng(a,i[o-1],k,A),"South"),m=T(t.map,c);e.lineTo(m.x,m.y)}}}}));var i=a%1e5!==0;t._drawLine(e,i);var c=D.convertUtmToLatLng(a,G[1],k,A);if(c.lng>s)try{var m=T(t.map,{lat:u,lng:c.lng}),v=t._getLabelText(a);w(e,v,t.options.fontColor,t.options.color,{x:m.x,y:m.y-15})}catch(p){}})),G.forEach((function(a,n,o){z.forEach((function(r,i,h){var g=D.convertUtmToLatLng(r,a,k,A),c=T(t.map,g);if(0===i){if(e.beginPath(),g.lng<s){var m=D.convertUtmToLatLng(h[i+1],a,k,A);try{g=N(g,m,"East"),c=T(t.map,g)}catch(p){return}}e.moveTo(c.x,c.y)}else if(i===h.length-1){if(g.lng<l){var v=N(g,D.convertUtmToLatLng(h[i-1],a,k,A),"East");c=T(t.map,v),e.lineTo(c.x,c.y)}else if(g.lng>l){var u=N(D.convertUtmToLatLng(h[i-1],o[n],k,A),g,"East");c=T(t.map,u),e.lineTo(c.x,c.y)}}else e.lineTo(c.x,c.y)}));var r=a%1e5!==0;t._drawLine(e,r);try{var i=D.convertUtmToLatLng(z[z.length-1],a,k,A),h=T(t.map,{lat:i.lat,lng:m}),g=t._getLabelText(a);w(e,g,t.options.fontColor,t.options.color,{x:h.x-15,y:h.y})}catch(c){return}}))}))}}}]),a}(v.Layer),R=(a(28),a(5));var V=function(){return Object(R.jsxs)(s.a,{center:[45.4,-75.7],zoom:7,minZoom:3,maxZoom:16,maxNativeZoom:15,maxBounds:[[-90,-180],[90,180]],children:[Object(R.jsx)(l.a,{url:"https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",attribution:'\xa9 <a href="https://wiki.openstreetmap.org/wiki/Esri"></a> contributors'}),Object(R.jsx)(U,{}),Object(R.jsx)(A,{}),Object(R.jsx)(E,{})]})};i.a.render(Object(R.jsx)(o.a.StrictMode,{children:Object(R.jsx)(V,{})}),document.getElementById("root"))}},[[33,1,2]]]);
//# sourceMappingURL=main.ca302a29.chunk.js.map