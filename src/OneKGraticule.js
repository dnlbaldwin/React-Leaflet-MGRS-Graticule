import { utmToLl, llToUtm, llToMgrs } from './Coordinates';
import { Bounds, latLng, Layer } from 'leaflet';
import { useMap } from 'react-leaflet';
import {
  connectToGzdBoundary,
  drawLabel,
  getAdjustedLatitude,
  getAdjustedLongitude,
  getAllVisibleGzds,
  getLineSlope,
} from './CommonUtils';
import { getGZD } from 'gzd-utils';

// The following indicies are used to indentify coordinates returned from gzd-utils
const SW_INDEX = 0;
const NW_INDEX = 1;
const NE_INDEX = 2;

const LATITUDE_INDEX = 1;
const LONGITUDE_INDEX = 0;

const MGRS_REGEX = /([0-9]+[A-Z])([A-Z]{2})(\d+)/;
const GZD_INDEX = 1;
const HK_INDEX = 2;
const GRID_INDEX = 3;

var utmObj = require('utm-latlng');
var utm = new utmObj(); // Defaults to WGS-84

const OneKGraticule = (props) => {
  let map = useMap();

  const canvas = document.createElement('canvas');
  canvas.classList.add('leaflet-zoom-animated');

  let g = new Graticule({ map: map, canvas: canvas });
  map.addLayer(g);

  return null;
};
class Graticule extends Layer {
  constructor(props) {
    super(props);

    this.updateVariables = this.updateVariables.bind(this);

    this.defaultOptions = {
      showGrid: true,
      showLabel: true,
      opacity: 10,
      weight: 1.5,
      color: '#000',
      hkColor: '#990000', //Font background colour and dash colour
      hkDashArray: [4, 4],
      font: '14px Courier New',
      fontColor: '#FFF',
      dashArray: [],
      hundredKMinZoom: 6,
      tenKMinZoom: 9,
      oneKMinZoom: 12,
      eastingBottom: true, // Display the eastings at the bottom the screen, else display at top
      NorthingRight: true, // Display the northings at the right the screen, else display at left
    };

    this.options = (props && props.options) || this.defaultOptions;

    this.map = props.map;
    this.canvas = props.canvas;
    this.currZoom = null;
    this.mgrsGridInterval = null;
  }

  updateVariables(props) {
    this.options = (props && props.options) || this.defaultOptions;
  }

  onAdd(map) {
    map._panes.overlayPane.appendChild(this.canvas);
    map.on('viewreset', this.reset, this);
    map.on('move', this.reset, this);

    this.reset();
  }

  onRemove(map) {
    map._panes.overlayPane.removeChild(this.canvas);
    map.off('viewreset', this.reset, this);
    map.off('move', this.reset, this);

    this.canvas = null;
    this.map = null;
  }

  reset() {
    const mapSize = this.map.getSize();
    const mapLeftTop = this.map.containerPointToLayerPoint([0, 0]);

    this.canvas.style['transform'] = `translate3d(${mapLeftTop.x}px,${mapLeftTop.y}px,0)`;

    this.canvas.width = mapSize.x;
    this.canvas.height = mapSize.y;

    if (this.map.getZoom() > this.options.oneKMinZoom) {
      this.mgrsGridInterval = 1000; //1k resolution
    } else if (this.map.getZoom() > this.options.tenKMinZoom) {
      this.mgrsGridInterval = 10000; //10k resolution
    } else if (this.map.getZoom() > this.options.hundredKMinZoom) {
      this.mgrsGridInterval = 100000; //100k resolution
    } else {
      this.mgrsGridInterval = null;
    }

    this.drawGrid();
  }

  /**
   *
   * @param {String} element - A UTM easting or northing element
   */
  _getLabelText(element) {
    // Divide by 1000 so that the labels will always be correct (10k vs 1k resolution)
    let label = ((element % 100000) / 1000).toString();

    if (this.mgrsGridInterval === 10000 && label === '0') {
      label = '00';
    }

    return label;
  }

  _drawLine(ctx, notHkLine) {
    if (notHkLine) {
      ctx.setLineDash(this.options.dashArray);
      ctx.lineWidth = this.options.weight + 1;
      ctx.strokeStyle = this.options.fontColor;
      ctx.stroke();
      ctx.lineWidth = this.options.weight;
      ctx.strokeStyle = this.options.color;
      ctx.stroke();
    } else {
      ctx.lineWidth = this.options.weight;
      ctx.strokeStyle = this.options.hkColor;
      ctx.setLineDash(this.options.hkDashArray);
      ctx.stroke();
    }
  }

  getVizGrids() {
    const nwBoundMgrs = llToMgrs(
      [this.map.getBounds().getNorthWest()['lng'], this.map.getBounds().getNorthWest()['lat']],
      1
    );
    const neBoundMgrs = llToMgrs(
      [this.map.getBounds().getNorthEast()['lng'], this.map.getBounds().getNorthEast()['lat']],
      1
    );
    const seBoundMgrs = llToMgrs(
      [this.map.getBounds().getSouthEast()['lng'], this.map.getBounds().getSouthEast()['lat']],
      1
    );
    const swBoundMgrs = llToMgrs(
      [this.map.getBounds().getSouthWest()['lng'], this.map.getBounds().getSouthWest()['lat']],
      1
    );

    let visibleGrids = getAllVisibleGzds(
      nwBoundMgrs.match(MGRS_REGEX)[GZD_INDEX],
      neBoundMgrs.match(MGRS_REGEX)[GZD_INDEX],
      seBoundMgrs.match(MGRS_REGEX)[GZD_INDEX],
      swBoundMgrs.match(MGRS_REGEX)[GZD_INDEX]
    );

    return visibleGrids;
  }

  drawGrid() {
    if (!this.canvas || !this.map) {
      return;
    }

    if (this.map.getZoom() < this.options.hundredKMinZoom) {
      return;
    }

    let ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.lineWidth = this.options.weight + 0.75;
    ctx.strokeStyle = '#FFF';
    ctx.fillStyle = this.options.color;
    ctx.setLineDash(this.options.dashArray);
    ctx.font = this.options.font;
    const visibleGzds = this.getVizGrids();

    const mapBounds = this.map.getBounds();

    visibleGzds.forEach((gzd, gzdIndex, visibleGridArr) => {
      // TODO - New LLtoUTM will give GZD long bands that are not valid (<1 and >60)
      const gzdObject = getGZD(gzd);

      const gzdWestBoundary = gzdObject['geometry']['coordinates'][0][NW_INDEX][LONGITUDE_INDEX];
      const gzdEastBoundary = gzdObject['geometry']['coordinates'][0][NE_INDEX][LONGITUDE_INDEX];
      const gzdNorthBoundary = gzdObject['geometry']['coordinates'][0][NW_INDEX][LATITUDE_INDEX];
      const gzdSouthBoundary = gzdObject['geometry']['coordinates'][0][SW_INDEX][LATITUDE_INDEX];

      // If drawing HK grids, just draw the entire GZD regardless
      let effectiveWestBoundary =
        gzdWestBoundary < mapBounds.getWest() && this.mgrsGridInterval !== 100000
          ? mapBounds.getWest()
          : gzdWestBoundary;
      let effectiveEastBoundary =
        gzdEastBoundary > mapBounds.getEast() && this.mgrsGridInterval !== 100000
          ? mapBounds.getEast()
          : gzdEastBoundary;
      let effectiveNorthBoundary = gzdNorthBoundary > mapBounds.getNorth() ? mapBounds.getNorth() : gzdNorthBoundary;
      let effectiveSouthBoundary = gzdSouthBoundary < mapBounds.getSouth() ? mapBounds.getSouth() : gzdSouthBoundary;

      const effectiveBounds = L.latLngBounds(
        L.latLng(effectiveNorthBoundary, effectiveWestBoundary),
        L.latLng(effectiveSouthBoundary, effectiveEastBoundary)
      );

      // Buffer is used to ensure that if we're right on the GZD boundary that we don't get the adjacent GZD
      const buffer = 0.00001;
      const swCornerUtm = llToUtm(effectiveSouthBoundary + buffer, effectiveWestBoundary + buffer);
      const seCornerUtm = llToUtm(effectiveSouthBoundary + buffer, effectiveEastBoundary - buffer);
      const nwCornerUtm = llToUtm(effectiveNorthBoundary - buffer, effectiveWestBoundary + buffer);
      const neCornerUtm = llToUtm(effectiveNorthBoundary - buffer, effectiveEastBoundary - buffer);

      let startingEasting = this.map.getCenter().lat >= 0 ? swCornerUtm.easting : nwCornerUtm.easting;
      let finalEasting = this.map.getCenter().lat >= 0 ? seCornerUtm.easting : neCornerUtm.easting;

      let startingNorthing = swCornerUtm.northing;
      let finalNorthing = neCornerUtm.northing;

      startingEasting = Math.floor(startingEasting / this.mgrsGridInterval) * this.mgrsGridInterval;
      finalEasting = Math.ceil(finalEasting / this.mgrsGridInterval) * this.mgrsGridInterval;
      startingNorthing = Math.floor(startingNorthing / this.mgrsGridInterval) * this.mgrsGridInterval;
      finalNorthing = Math.ceil(finalNorthing / this.mgrsGridInterval) * this.mgrsGridInterval;

      let eastingArray = [];
      for (let i = startingEasting; i <= finalEasting; i += this.mgrsGridInterval) {
        eastingArray.push(i);
      }

      let northingArray = [];
      for (let i = startingNorthing; i <= finalNorthing; i += this.mgrsGridInterval) {
        northingArray.push(i);
      }

      let zoneLetter = nwCornerUtm.zoneLetter;
      let zoneNumber = nwCornerUtm.zoneNumber;

      // Lines of constant Eastings

      eastingArray.forEach((eastingElem, eastingIndex, eastArr) => {
        northingArray.forEach((northingElem, northingIndex, northArr) => {
          let gridIntersectionLl = utmToLl(eastingElem, northingElem, zoneNumber, zoneLetter);

          // The grid array is larger than the GZD.  As such the first and last elements of the easting/northing
          // arrays will be outside of the GZD.  These points are required because they are used to derive the
          // point of intersection with the GZD boundary.
          if (gridIntersectionLl.lng > gzdEastBoundary) {
            return;
          } else if (gridIntersectionLl.lng < gzdWestBoundary) {
            return;
          }
          // This block will truncate the line at the southern boundary of the GZD
          if (gridIntersectionLl.lat <= gzdSouthBoundary) {
            let nextIntersectionLl = utmToLl(eastingElem, northArr[northingIndex + 1], zoneNumber, zoneLetter);
            gridIntersectionLl = connectToGzdBoundary(gridIntersectionLl, nextIntersectionLl, 'North');
            // This block will truncate the line at the northern boundary of the GZD
          } else if (gridIntersectionLl.lat > gzdNorthBoundary) {
            let previousIntersectionLl = utmToLl(eastingElem, northArr[northingIndex - 1], zoneNumber, zoneLetter);

            gridIntersectionLl = connectToGzdBoundary(gridIntersectionLl, previousIntersectionLl, 'South');
          }
          let gridIntersectionXy;
          if (gridIntersectionLl.lat && gridIntersectionLl.lng) {
            gridIntersectionXy = this.map.latLngToContainerPoint(gridIntersectionLl);
          } else {
            return;
          }

          if (northingIndex === 0) {
            ctx.beginPath();
            ctx.moveTo(gridIntersectionXy.x, gridIntersectionXy.y);
          } else {
            ctx.lineTo(gridIntersectionXy.x, gridIntersectionXy.y);
          }
        });
        const notHkLine = eastingElem % 100000 !== 0;
        this._drawLine(ctx, notHkLine);
        // HACK - Begin path doesn't appear to get called in edge cases in the following loop
        ctx.beginPath();
      });

      // Lines of constant Northings
      northingArray.forEach((northingElem, northingIndex, northArr) => {
        eastingArray.forEach((eastingElem, eastingIndex, eastArr) => {
          let gridIntersectionLl = utmToLl(eastingElem, northingElem, zoneNumber, zoneLetter);

          // The grid array is larger than the GZD.  As such the first and last elements of the easting/northing
          // arrays will be outside of the GZD.  These points are required because they are used to derive the
          // point of intersection with the GZD boundary.
          if (gridIntersectionLl.lat > gzdNorthBoundary || gridIntersectionLl.lat < gzdSouthBoundary) {
            return;
          }
          let gridIntersectionXy = this.map.latLngToContainerPoint(gridIntersectionLl);
          if (eastingIndex === 0) {
            ctx.beginPath();
            // Truncate the line to the effective western boundary
            if (gridIntersectionLl.lng < effectiveWestBoundary) {
              const nextGridIntersectionLl = utmToLl(eastArr[eastingIndex + 1], northingElem, zoneNumber, zoneLetter);
              const slope = getLineSlope(gridIntersectionLl, nextGridIntersectionLl);

              try {
                gridIntersectionLl.lat = getAdjustedLatitude(slope, effectiveWestBoundary, gridIntersectionLl);

                gridIntersectionLl.lng = effectiveWestBoundary;

                gridIntersectionXy = this.map.latLngToContainerPoint(gridIntersectionLl);
              } catch (e) {
                console.error(e);
                console.trace();
              }
            }

            ctx.moveTo(gridIntersectionXy.x, gridIntersectionXy.y);
          } else {
            // Truncate the line to the effective eastern boundary
            if (gridIntersectionLl.lng > effectiveEastBoundary) {
              const previousGridIntersectionLl = utmToLl(
                eastArr[eastingIndex - 1],
                northingElem,
                zoneNumber,
                zoneLetter
              );
              const slope = getLineSlope(gridIntersectionLl, previousGridIntersectionLl);

              try {
                gridIntersectionLl.lat = getAdjustedLatitude(slope, effectiveEastBoundary, gridIntersectionLl);

                gridIntersectionLl.lng = effectiveEastBoundary;

                gridIntersectionXy = this.map.latLngToContainerPoint(gridIntersectionLl);
              } catch (e) {
                console.error(e);
                console.trace();
              }
            }
            ctx.lineTo(gridIntersectionXy.x, gridIntersectionXy.y);
          }
        });

        const notHkLine = northingElem % 100000 !== 0;
        this._drawLine(ctx, notHkLine);
      });

      let skipRemainder = false;
      // Draw the labels
      if (this.mgrsGridInterval === 100000) {
        eastingArray.forEach((eastingElem, eastingIndex, ea) => {
          if (skipRemainder) {
            return;
          }
          northingArray.forEach((northingElem, northingIndex, na) => {
            let labelLl;
            let currentLl = utmToLl(eastingElem, northingElem, zoneNumber, zoneLetter);
            let adjacentLlNorthing;
            let adjacentLlEasting;

            if (eastingIndex !== ea.length - 1) {
              adjacentLlEasting = utmToLl(ea[eastingIndex + 1], northingElem, zoneNumber, zoneLetter);
              if (adjacentLlEasting.lng > effectiveEastBoundary) {
                const slope = getLineSlope(currentLl, adjacentLlEasting);
                adjacentLlEasting.lat = getAdjustedLatitude(slope, effectiveEastBoundary, adjacentLlEasting);
                adjacentLlEasting.lng = effectiveEastBoundary;
                skipRemainder = true;
              }
            } else {
              adjacentLlEasting = utmToLl(ea[eastingIndex - 1], northingElem, zoneNumber, zoneLetter);
            }

            if (northingIndex !== na.length - 1) {
              adjacentLlNorthing = utmToLl(eastingElem, na[northingIndex + 1], zoneNumber, zoneLetter);
            } else {
              adjacentLlNorthing = utmToLl(eastingElem, na[northingIndex - 1], zoneNumber, zoneLetter);
            }

            if (currentLl.lng < effectiveWestBoundary) {
              const slope = getLineSlope(currentLl, adjacentLlEasting);
              currentLl.lat = getAdjustedLatitude(slope, effectiveWestBoundary, currentLl);
              currentLl.lng = effectiveWestBoundary;
            } else if (currentLl.lng > effectiveEastBoundary) {
              const slope = getLineSlope(currentLl, adjacentLlEasting);
              currentLl.lat = getAdjustedLatitude(slope, effectiveEastBoundary, currentLl);
              currentLl.lng = effectiveEastBoundary;
            }

            if (L.latLng(currentLl).distanceTo(adjacentLlEasting) < 10000) {
              return;
            }

            labelLl = {
              lat: (currentLl.lat + adjacentLlNorthing.lat) / 2,
              lng: (currentLl.lng + adjacentLlEasting.lng) / 2,
            };

            try {
              if (labelLl && effectiveBounds.contains(labelLl)) {
                let labelText = llToMgrs([labelLl.lng, labelLl.lat]).match(MGRS_REGEX)[HK_INDEX];

                drawLabel(
                  ctx,
                  labelText,
                  this.options.fontColor,
                  this.options.hkColor,
                  this.map.latLngToContainerPoint(labelLl)
                );
              }
            } catch (e) {
              return;
            }
          });
        });
      } else {
        eastingArray.forEach((eastingElem, eastingIndex, ea) => {
          if (!(eastingIndex === 0 || eastingIndex === ea.length - 1)) {
            let labelXy;
            try {
              let labelLl = utmToLl(eastingElem, northingArray[1], zoneNumber, zoneLetter);

              labelXy = this.map.latLngToContainerPoint({ lat: effectiveSouthBoundary, lng: labelLl.lng });
            } catch (e) {
              return;
            }

            let labelText = this._getLabelText(eastingElem);

            drawLabel(ctx, labelText, this.options.fontColor, this.options.color, { x: labelXy.x, y: labelXy.y - 15 });
          }
        });

        northingArray.forEach((northingElem, northingIndex, na) => {
          let labelXy;
          try {
            let labelLl = utmToLl(eastingArray[eastingArray.length - 1], northingElem, zoneNumber, zoneLetter);

            labelXy = this.map.latLngToContainerPoint({ lat: labelLl.lat, lng: effectiveEastBoundary });
          } catch (e) {
            return;
          }

          let labelText = this._getLabelText(northingElem);

          drawLabel(ctx, labelText, this.options.fontColor, this.options.color, { x: labelXy.x - 15, y: labelXy.y });
        });
      }
    });
  }
}

export { OneKGraticule };
