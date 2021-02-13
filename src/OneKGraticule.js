import { utmToLl, llToUtm, llToMgrs } from './Coordinates';
import { Layer } from 'leaflet';
import { useMap } from 'react-leaflet';
import { connectToGzdBoundary, drawLabel, getAllVisibleGzds } from './CommonUtils';
import { getGZD } from 'gzd-utils';

// The following indicies are used to indentify coordinates returned from gzd-utils
const SW_INDEX = 0;
const NW_INDEX = 1;
const NE_INDEX = 2;

const LATITUDE_INDEX = 1;
const LONGITUDE_INDEX = 0;

const MGRS_REGEX = /([0-9]+[A-Z])([A-Z]{2})(\d+)/;
const GZD_INDEX = 1;

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
      let effectiveWestGzdBoundary =
        gzdWestBoundary < mapBounds.getWest() && this.mgrsGridInterval !== 100000
          ? mapBounds.getWest()
          : gzdWestBoundary;
      let effectiveEastGzdBoundary =
        gzdEastBoundary > mapBounds.getEast() && this.mgrsGridInterval !== 100000
          ? mapBounds.getEast()
          : gzdEastBoundary;
      let effectiveWNorthGzdBoundary =
        gzdNorthBoundary > mapBounds.getNorth() ? mapBounds.getNorth() : gzdNorthBoundary;
      let effectiveSouthGzdBoundary = gzdSouthBoundary < mapBounds.getSouth() ? mapBounds.getSouth() : gzdSouthBoundary;

      // Buffer is used to ensure that if we're right on the GZD boundary that we don't get the adjacent GZD
      const buffer = 0.00001;
      const swCornerUtm = llToUtm(effectiveSouthGzdBoundary + buffer, effectiveWestGzdBoundary + buffer);
      const seCornerUtm = llToUtm(effectiveSouthGzdBoundary + buffer, effectiveEastGzdBoundary - buffer);
      const nwCornerUtm = llToUtm(effectiveWNorthGzdBoundary - buffer, effectiveWestGzdBoundary + buffer);
      const neCornerUtm = llToUtm(effectiveWNorthGzdBoundary - buffer, effectiveEastGzdBoundary - buffer);

      // Draw easting lines
      let startingEasting = this._map.getCenter().lat >= 0 ? swCornerUtm.easting : nwCornerUtm.easting;
      let finalEasting = this._map.getCenter().lat >= 0 ? seCornerUtm.easting : neCornerUtm.easting;

      let startingNorthing = swCornerUtm.northing;
      let finalNorthing = neCornerUtm.northing;

      startingEasting = Math.floor(startingEasting / this.mgrsGridInterval) * this.mgrsGridInterval;
      finalEasting = Math.floor(finalEasting / this.mgrsGridInterval) * this.mgrsGridInterval;
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
        let shouldSkip = false;

        northingArray.forEach((northingElem, northingIndex, northArr) => {
          if (shouldSkip) {
            return;
          }
          let gridIntersectionLl = utmToLl(eastingElem, northingElem, zoneNumber, zoneLetter);
          if (gridIntersectionLl.lng < gzdWestBoundary || gridIntersectionLl.lng > gzdEastBoundary) {
            ctx.beginPath();
            return; //No need to draw this because it's outside the GZD - floor calculation from above.
          }

          if (gridIntersectionLl.lat < gzdSouthBoundary) {
            let nextIntersectionLl = utmToLl(eastingElem, northArr[northingIndex + 1], zoneNumber, zoneLetter);
            gridIntersectionLl = connectToGzdBoundary(gridIntersectionLl, nextIntersectionLl, 'North');
          }
          let gridIntersectionXy;
          if (gridIntersectionLl) {
            gridIntersectionXy = this.map.latLngToContainerPoint(gridIntersectionLl);
          } else {
            return;
          }

          if (northingIndex === 0) {
            ctx.beginPath();
            ctx.moveTo(gridIntersectionXy.x, gridIntersectionXy.y);
          } else {
            if (gridIntersectionLl.lng > gzdEastBoundary) {
              shouldSkip = true;
            }

            if (gridIntersectionLl.lat > gzdNorthBoundary) {
              let previousIntersectionLl = utmToLl(eastingElem, northArr[northingIndex - 1], zoneNumber, zoneLetter);

              gridIntersectionLl = connectToGzdBoundary(gridIntersectionLl, previousIntersectionLl, 'South');

              gridIntersectionXy = this.map.latLngToContainerPoint(gridIntersectionLl);
            }
            ctx.lineTo(gridIntersectionXy.x, gridIntersectionXy.y);
          }
        });

        const notHkLine = eastingElem % 100000 !== 0;
        this._drawLine(ctx, notHkLine);

        let gridLabelLl = utmToLl(eastingElem, northingArray[1], zoneNumber, zoneLetter);

        if (gridLabelLl.lng > gzdWestBoundary) {
          try {
            let gridLabelXy = this.map.latLngToContainerPoint({
              lat: effectiveSouthGzdBoundary,
              lng: gridLabelLl.lng,
            });

            let label = this._getLabelText(eastingElem);
            drawLabel(ctx, label, this.options.fontColor, this.options.color, {
              x: gridLabelXy.x,
              y: gridLabelXy.y - 15,
            });
          } catch (e) {}
        }
      });

      // Lines of constant Northings
      northingArray.forEach((northingElem, northingIndex, northArr) => {
        eastingArray.forEach((eastingElem, eastingIndex, eastArr) => {
          let gridIntersectionLl = utmToLl(eastingElem, northingElem, zoneNumber, zoneLetter);

          // TODO - how does this hack fix HK lines
          if (gridIntersectionLl.lat < gzdSouthBoundary || gridIntersectionLl.lat > gzdNorthBoundary) {
            ctx.beginPath();
            if (eastingIndex === 0) {
              let nextIntersectionLl = utmToLl(eastArr[eastingIndex + 1], northingElem, zoneNumber, zoneLetter);
              try {
                gridIntersectionLl = connectToGzdBoundary(gridIntersectionLl, nextIntersectionLl, 'North');
                gridIntersectionXy = this.map.latLngToContainerPoint(gridIntersectionLl);
              } catch (e) {
                return;
              }
              ctx.moveTo(gridIntersectionXy.x, gridIntersectionXy.y);
            }
            return;
          } else {
            let gridIntersectionXy = this.map.latLngToContainerPoint(gridIntersectionLl);
            if (eastingIndex === 0) {
              ctx.beginPath();
              // If the first point lies to the west of the GZD, truncate it
              if (gridIntersectionLl.lng < gzdWestBoundary) {
                let nextIntersectionLl = utmToLl(eastArr[eastingIndex + 1], northingElem, zoneNumber, zoneLetter);
                try {
                  gridIntersectionLl = connectToGzdBoundary(gridIntersectionLl, nextIntersectionLl, 'East');
                  gridIntersectionXy = this.map.latLngToContainerPoint(gridIntersectionLl);
                } catch (e) {
                  return;
                }
              }
              ctx.moveTo(gridIntersectionXy.x, gridIntersectionXy.y);
            } else if (eastingIndex === eastArr.length - 1) {
              let previousIntersectionLl = utmToLl(eastArr[eastingIndex - 1], northingElem, zoneNumber, zoneLetter);
              let gzdIntersectionLl =
                gridIntersectionLl.lng < gzdEastBoundary
                  ? connectToGzdBoundary(gridIntersectionLl, previousIntersectionLl, 'East')
                  : connectToGzdBoundary(gridIntersectionLl, previousIntersectionLl, 'West');

              gridIntersectionXy = this.map.latLngToContainerPoint(gzdIntersectionLl);

              ctx.lineTo(gridIntersectionXy.x, gridIntersectionXy.y);
            } else {
              ctx.lineTo(gridIntersectionXy.x, gridIntersectionXy.y);
            }
          }
        });
        const notHkLine = northingElem % 100000 !== 0;
        this._drawLine(ctx, notHkLine);

        try {
          let gridLabelLl = utmToLl(eastingArray[eastingArray.length - 1], northingElem, zoneNumber, zoneLetter);
          let gridLabelXy = this.map.latLngToContainerPoint({
            lat: gridLabelLl.lat,
            lng: effectiveEastGzdBoundary,
          });

          let label = this._getLabelText(northingElem);

          drawLabel(ctx, label, this.options.fontColor, this.options.color, {
            x: gridLabelXy.x - 15,
            y: gridLabelXy.y,
          });
        } catch (e) {
          return;
        }
      });
    });
  }
}

export { OneKGraticule };
