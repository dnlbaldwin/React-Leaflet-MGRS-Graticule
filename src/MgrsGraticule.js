import {
  connectToGzdBoundary,
  drawLabel,
  getAdjustedLatitude,
  getAllVisibleGzds,
  getGzd,
  getLineSlope,
} from './CommonUtils';
import { llToMgrs, llToUtm, utmToLl } from './Coordinates';

import { useMap } from 'react-leaflet';

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

const MgrsGraticule = (props) => {
  let map = useMap();
  let g = new Graticule(map, props.name, props.checked, props.options);

  return null;
};

class Graticule {
  constructor(map, name, checked, opt) {
    this.currLatInterval = 8;
    this.currLngInterval = 6;

    this.defaultOptions = {
      showGrid: true,
      color: '#888888',
      font: '14px Courier New',
      fontColor: '#ffffff',
      dashArray: [6, 6],
      weight: 1.5,
      gridColor: '#000',
      hkColor: '#990000', //Font background colour and dash colour
      hkDashArray: [4, 4],
      gridFont: '14px Courier New',
      gridFontColor: '#ffffff',
      gridDashArray: [],
      hundredKMinZoom: 6,
      tenKMinZoom: 9,
      oneKMinZoom: 12,
      hundredMMinZoom: 15,
    };

    // Override any default options with the options passed from props
    this.options = { ...this.defaultOptions, ...opt };

    this.map = map;
    this.canvas = document.createElement('canvas');
    this.canvas.classList.add('leaflet-zoom-animated');
    this.canvas.classList.add(this.name);

    this.ctx = this.canvas.getContext('2d');

    this.map.on('viewreset', this.reset, this);
    this.map.on('move', this.reset, this);
    this.map.on('overlayadd', this.showGraticule, this);
    this.map.on('overlayremove', this.clearRect, this);

    // Strip any spaces as they can't be used in class names
    this.name = name.replace(/\s/g, '');

    if (checked) {
      this.options.showGrid = true;
      this.reset();
    } else {
      this.options.showGrid = false;
    }

    // Add the canvas only if it hasn't already been added
    if (!this.map.getPanes().overlayPane.classList.contains(this.name)) {
      this.map.getPanes().overlayPane.appendChild(this.canvas);
    }
  }

  clearRect(e) {
    if (e.name === this.name) {
      let ctx = this.canvas.getContext('2d');
      ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.options.showGrid = false;
    }
  }

  showGraticule(e) {
    if (e.name === this.name) {
      this.options.showGrid = true;
      this.reset();
    }
  }

  reset() {
    if (!this.options.showGrid) {
      return;
    }
    const mapSize = this.map.getSize();
    const mapLeftTop = this.map.containerPointToLayerPoint([0, 0]);

    this.canvas.style['transform'] = `translate3d(${mapLeftTop.x}px,${mapLeftTop.y}px,0)`;

    this.canvas.width = mapSize.x;
    this.canvas.height = mapSize.y;

    if (this.map.getZoom() > this.options.hundredMMinZoom) {
      this.mgrsGridInterval = 100; //100m resolution
    } else if (this.map.getZoom() > this.options.oneKMinZoom) {
      this.mgrsGridInterval = 1000; //1k resolution
    } else if (this.map.getZoom() > this.options.tenKMinZoom) {
      this.mgrsGridInterval = 10000; //10k resolution
    } else if (this.map.getZoom() > this.options.hundredKMinZoom) {
      this.mgrsGridInterval = 100000; //100k resolution
    } else {
      this.mgrsGridInterval = null;
    }

    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawGrid(this.ctx);
    this.drawGzd(this.ctx);
  }

  drawGzd(ctx) {
    if (!this.canvas || !this.map || !this.ctx) {
      return;
    }

    if (this.map.getZoom() < this.options.minZoom) {
      return;
    }

    ctx.lineWidth = this.options.weight;
    ctx.strokeStyle = this.options.color;
    ctx.fillStyle = this.options.color;
    ctx.setLineDash(this.options.dashArray);
    if (this.options.font) {
      ctx.font = this.options.font;
    }

    let leftTop = this.map.containerPointToLatLng({ x: 0, y: 0 });
    let rightBottom = this.map.containerPointToLatLng({
      x: this.canvas.width,
      y: this.canvas.height,
    });

    let pointPerLat = (leftTop.lat - rightBottom.lat) / (this.canvas.height * 0.2);
    let pointPerLon = (rightBottom.lng - leftTop.lng) / (this.canvas.width * 0.2);

    if (isNaN(pointPerLat) || isNaN(pointPerLon)) {
      return;
    }

    if (pointPerLat < 1) {
      pointPerLat = 1;
    }
    if (pointPerLon < 1) {
      pointPerLon = 1;
    }

    if (rightBottom.lat < -90) {
      rightBottom.lat = -90;
    } else {
      rightBottom.lat = parseInt(rightBottom.lat - pointPerLat, 10);
    }

    if (leftTop.lat > 90) {
      leftTop.lat = 90;
    } else {
      leftTop.lat = parseInt(leftTop.lat + pointPerLat, 10);
    }

    if (leftTop.lng > 0 && rightBottom.lng < 0) {
      rightBottom.lng += 360;
    }
    rightBottom.lng = parseInt(rightBottom.lng + pointPerLon, 10);
    leftTop.lng = parseInt(leftTop.lng - pointPerLon, 10);

    // Northern hemisphere
    for (let i = this.currLatInterval; i <= leftTop.lat; i += this.currLatInterval) {
      if (i >= rightBottom.lat) {
        // Handle 'X' MGRS Zone - Do not need it for the southern equivalent 'C'
        if (i === 80) {
          i = 84;
        }
        this.drawLatitudeLine(ctx, i, leftTop.lng, rightBottom.lng);
      }
    }

    // Southern hemisphere
    for (let i = 0; i >= rightBottom.lat; i -= this.currLatInterval) {
      if (i <= leftTop.lat) {
        this.drawLatitudeLine(ctx, i, leftTop.lng, rightBottom.lng);
      }
    }

    // HACK - Add six to the right bottom lng to make sure the East 31V boundary is displayed at all times
    for (let i = -180; i <= rightBottom.lng + 6; i += this.currLngInterval) {
      this.drawLongitudeLine(ctx, i, leftTop.lat, rightBottom.lat);
    }
  }

  drawLatitudeLine(ctx, tick, lngLeft, lngRight) {
    const leftEnd = this.map.latLngToContainerPoint({
      lat: tick,
      lng: lngLeft,
    });

    const rightEnd = this.map.latLngToContainerPoint({
      lat: tick,
      lng: lngRight,
    });

    ctx.beginPath();
    ctx.moveTo(leftEnd.x, leftEnd.y);
    ctx.lineTo(rightEnd.x, rightEnd.y);
    ctx.stroke();
  }

  drawLongitudeLine(ctx, tick, latTop, latBottom) {
    if (latTop >= 84) {
      latTop = 84; // Ensure GZD vertical lines do not extend into the arctic
    }

    if (latBottom <= -80) {
      latBottom = -80; // Ensure GZD vertical lines do not extend into the antarctic
    }

    const canvasTop = this.map.latLngToContainerPoint({
      lat: latTop,
      lng: tick,
    });

    const canvasBottom = this.map.latLngToContainerPoint({
      lat: latBottom,
      lng: tick,
    });

    const TOP_OF_W_SERIES_GZD = 72;

    ctx.beginPath();
    // Handle Norway
    if (tick === 6) {
      const TOP_OF_V_SERIES_GZD = 64;
      const BOTTOM_OF_V_SERIES_GZD = 56;
      const RIGHT_OF_31_SERIES_GZD = 3;

      const RIGHT_TOP_OF_GZD = this.map.latLngToContainerPoint({
        lat: TOP_OF_V_SERIES_GZD,
        lng: tick,
      });

      const LEFT_TOP_OF_GZD = this.map.latLngToContainerPoint({
        lat: TOP_OF_V_SERIES_GZD,
        lng: RIGHT_OF_31_SERIES_GZD,
      });

      const LEFT_BOTTOM_OF_GZD = this.map.latLngToContainerPoint({
        lat: BOTTOM_OF_V_SERIES_GZD,
        lng: RIGHT_OF_31_SERIES_GZD,
      });

      const RIGHT_BOTTOM_OF_GZD = this.map.latLngToContainerPoint({
        lat: BOTTOM_OF_V_SERIES_GZD,
        lng: tick,
      });
      if (latTop > TOP_OF_V_SERIES_GZD && latBottom > BOTTOM_OF_V_SERIES_GZD) {
        // Top segment only
        // Do not draw through Svalbard
        if (latTop > TOP_OF_W_SERIES_GZD) {
          const TOP_LEFT_OF_32_SERIES_GZD = this.map.latLngToContainerPoint({
            lat: TOP_OF_W_SERIES_GZD,
            lng: tick,
          });
          ctx.moveTo(TOP_LEFT_OF_32_SERIES_GZD.x, TOP_LEFT_OF_32_SERIES_GZD.y);
        } else {
          ctx.moveTo(canvasTop.x, canvasTop.y);
        }

        ctx.lineTo(RIGHT_TOP_OF_GZD.x, RIGHT_TOP_OF_GZD.y);

        ctx.moveTo(LEFT_TOP_OF_GZD.x, LEFT_TOP_OF_GZD.y);

        ctx.lineTo(LEFT_TOP_OF_GZD.x, canvasBottom.y);
      } else if (
        //Bottom segment only
        latTop < TOP_OF_V_SERIES_GZD &&
        latBottom < BOTTOM_OF_V_SERIES_GZD
      ) {
        ctx.moveTo(LEFT_TOP_OF_GZD.x, canvasTop.y);

        ctx.lineTo(LEFT_BOTTOM_OF_GZD.x, LEFT_BOTTOM_OF_GZD.y);

        ctx.moveTo(RIGHT_BOTTOM_OF_GZD.x, RIGHT_BOTTOM_OF_GZD.y);

        ctx.lineTo(RIGHT_BOTTOM_OF_GZD.x, canvasBottom.y);
      } else if (
        // Entire thing
        latTop >= TOP_OF_V_SERIES_GZD &&
        latBottom <= BOTTOM_OF_V_SERIES_GZD
      ) {
        // Do not draw through Svalbard
        if (latTop > TOP_OF_W_SERIES_GZD) {
          const TOP_LEFT_OF_32_SERIES_GZD = this.map.latLngToContainerPoint({
            lat: TOP_OF_W_SERIES_GZD,
            lng: tick,
          });
          ctx.moveTo(TOP_LEFT_OF_32_SERIES_GZD.x, TOP_LEFT_OF_32_SERIES_GZD.y);
        } else {
          ctx.moveTo(canvasTop.x, canvasTop.y);
        }

        ctx.lineTo(RIGHT_TOP_OF_GZD.x, RIGHT_TOP_OF_GZD.y);

        ctx.moveTo(LEFT_TOP_OF_GZD.x, LEFT_TOP_OF_GZD.y);

        ctx.lineTo(LEFT_BOTTOM_OF_GZD.x, LEFT_BOTTOM_OF_GZD.y);

        ctx.moveTo(RIGHT_TOP_OF_GZD.x, LEFT_BOTTOM_OF_GZD.y);

        ctx.lineTo(RIGHT_TOP_OF_GZD.x, canvasBottom.y);
      } else if (
        // Modified vertical only
        latTop <= TOP_OF_V_SERIES_GZD &&
        latBottom >= BOTTOM_OF_V_SERIES_GZD
      ) {
        ctx.moveTo(LEFT_TOP_OF_GZD.x, canvasTop.y);

        ctx.lineTo(LEFT_BOTTOM_OF_GZD.x, canvasBottom.y);
      }
    } else if (tick === 12) {
      if (latTop > TOP_OF_W_SERIES_GZD && latTop <= 84) {
        // Handle Svalbard
        const TOP_LEFT_OF_33X_GZD = this.map.latLngToContainerPoint({
          lat: latTop,
          lng: 9,
        });
        ctx.moveTo(TOP_LEFT_OF_33X_GZD.x, TOP_LEFT_OF_33X_GZD.y);

        const BOTTOM_LEFT_OF_33X_GZD = this.map.latLngToContainerPoint({
          lat: TOP_OF_W_SERIES_GZD,
          lng: 9,
        });

        ctx.lineTo(BOTTOM_LEFT_OF_33X_GZD.x, BOTTOM_LEFT_OF_33X_GZD.y);

        const TOP_RIGHT_OF_32W_GZD = this.map.latLngToContainerPoint({
          lat: TOP_OF_W_SERIES_GZD,
          lng: tick,
        });

        ctx.moveTo(TOP_RIGHT_OF_32W_GZD.x, TOP_RIGHT_OF_32W_GZD.y);

        ctx.lineTo(canvasBottom.x, canvasBottom.y);
      } else {
        // Normal use case
        ctx.moveTo(canvasTop.x, canvasTop.y);
        ctx.lineTo(canvasBottom.x, canvasBottom.y);
      }
    } else if (tick === 18) {
      // Do not draw through Svalbard
      if (latTop > TOP_OF_W_SERIES_GZD) {
        const TOP_LEFT_OF_34_SERIES_GZD = this.map.latLngToContainerPoint({
          lat: TOP_OF_W_SERIES_GZD,
          lng: tick,
        });
        ctx.moveTo(TOP_LEFT_OF_34_SERIES_GZD.x, TOP_LEFT_OF_34_SERIES_GZD.y);
      } else {
        ctx.moveTo(canvasTop.x, canvasTop.y);
      }
      ctx.lineTo(canvasBottom.x, canvasBottom.y);
    } else if (tick === 24) {
      if (latTop > TOP_OF_W_SERIES_GZD && latTop <= 84) {
        // Handle Svalbard
        const TOP_LEFT_OF_35X_GZD = this.map.latLngToContainerPoint({
          lat: latTop,
          lng: 21,
        });
        ctx.moveTo(TOP_LEFT_OF_35X_GZD.x, TOP_LEFT_OF_35X_GZD.y);

        const BOTTOM_LEFT_OF_35X_GZD = this.map.latLngToContainerPoint({
          lat: TOP_OF_W_SERIES_GZD,
          lng: 21,
        });

        ctx.lineTo(BOTTOM_LEFT_OF_35X_GZD.x, BOTTOM_LEFT_OF_35X_GZD.y);

        const TOP_RIGHT_OF_34W_GZD = this.map.latLngToContainerPoint({
          lat: TOP_OF_W_SERIES_GZD,
          lng: tick,
        });

        ctx.moveTo(TOP_RIGHT_OF_34W_GZD.x, TOP_RIGHT_OF_34W_GZD.y);

        ctx.lineTo(canvasBottom.x, canvasBottom.y);
      } else {
        // Normal use case
        ctx.moveTo(canvasTop.x, canvasTop.y);
        ctx.lineTo(canvasBottom.x, canvasBottom.y);
      }
    } else if (tick === 30) {
      // Do not draw through Svalbard
      if (latTop > TOP_OF_W_SERIES_GZD) {
        const TOP_LEFT_OF_35_SERIES_GZD = this.map.latLngToContainerPoint({
          lat: TOP_OF_W_SERIES_GZD,
          lng: tick,
        });
        ctx.moveTo(TOP_LEFT_OF_35_SERIES_GZD.x, TOP_LEFT_OF_35_SERIES_GZD.y);
      } else {
        ctx.moveTo(canvasTop.x, canvasTop.y);
      }
      ctx.lineTo(canvasBottom.x, canvasBottom.y);
    } else if (tick === 36) {
      if (latTop > TOP_OF_W_SERIES_GZD && latTop <= 84) {
        // Handle Svalbard
        const TOP_LEFT_OF_37X_GZD = this.map.latLngToContainerPoint({
          lat: latTop,
          lng: 33,
        });
        ctx.moveTo(TOP_LEFT_OF_37X_GZD.x, TOP_LEFT_OF_37X_GZD.y);

        const BOTTOM_LEFT_OF_37X_GZD = this.map.latLngToContainerPoint({
          lat: TOP_OF_W_SERIES_GZD,
          lng: 33,
        });

        ctx.lineTo(BOTTOM_LEFT_OF_37X_GZD.x, BOTTOM_LEFT_OF_37X_GZD.y);

        const TOP_RIGHT_OF_36W_GZD = this.map.latLngToContainerPoint({
          lat: TOP_OF_W_SERIES_GZD,
          lng: tick,
        });

        ctx.moveTo(TOP_RIGHT_OF_36W_GZD.x, TOP_RIGHT_OF_36W_GZD.y);

        ctx.lineTo(canvasBottom.x, canvasBottom.y);
      } else {
        // Normal use case
        ctx.moveTo(canvasTop.x, canvasTop.y);
        ctx.lineTo(canvasBottom.x, canvasBottom.y);
      }
    }
    // The rest of the world...
    else {
      ctx.moveTo(canvasTop.x, canvasTop.y);
      ctx.lineTo(canvasBottom.x, canvasBottom.y);
    }
    ctx.stroke();

    this.drawGzdLabels(tick);
  }

  /** This function encapsulates drawing labels for GZDs
   *
   * @param {Int} longitude - The longitude (representing a boundary of a GZD) for which needs labels drawn for
   */
  drawGzdLabels(longitude) {
    // -76 = middle latitude of the 'C' band - place the label in the middle
    for (let labelLatitude = -76; labelLatitude < 84; labelLatitude += 8) {
      let labelLongitude;
      if (labelLatitude === 60) {
        if (longitude === 0) {
          //31V
          labelLongitude = 1.5;
        } else if (longitude === 6) {
          //32V
          labelLongitude = 7.5;
        } else {
          labelLongitude = longitude + 3;
        }
      } else if (labelLatitude === 76) {
        if (longitude === 0) {
          //31X
          labelLongitude = 4.5;
        } else if (longitude === 12) {
          //33X
          labelLongitude = 15;
        } else if (longitude === 24) {
          //35X
          labelLongitude = 27;
        } else if (longitude === 36) {
          //37X
          labelLongitude = 37.5;
        } else {
          labelLongitude = longitude + 3;
        }
      } else {
        // Rest of the world...
        labelLongitude = longitude + 3;
      }

      let gzdLabel;
      try {
        gzdLabel = llToMgrs([labelLongitude, labelLatitude], 1).match(MGRS_REGEX)[GZD_INDEX];
      } catch (error) {
        return; //Invalid MGRS value returned, so no need to try to display a label
      }

      // Don't want to display duplicates of the following zones
      if (
        !(gzdLabel === '33X' && longitude === 6) &&
        !(gzdLabel === '35X' && longitude === 18) &&
        !(gzdLabel === '37X' && longitude === 30)
      ) {
        const labelXy = this.map.latLngToContainerPoint({
          lat: labelLatitude,
          lng: labelLongitude,
        });

        drawLabel(this.ctx, gzdLabel, this.options.fontColor, this.options.color, labelXy);
      }
    }
  }

  /**
   *
   * @param {String} element - A UTM easting or northing element
   */
  _getLabelText(element) {
    // Divide by 1000 so that the labels will always be correct (10k vs 1k resolution)
    let label =
      this.mgrsGridInterval === 10000 || this.mgrsGridInterval === 1000
        ? ((element % 100000) / 1000).toString()
        : ((element % 100000) / 100).toString();

    if (this.mgrsGridInterval === 100) {
      label = label.padStart(3, '0');
    }

    return label;
  }

  _drawLine(ctx, notHkLine) {
    if (notHkLine) {
      ctx.setLineDash(this.options.gridDashArray);
      ctx.lineWidth = this.options.weight + 1;
      ctx.strokeStyle = this.options.gridFontColor;
      ctx.stroke();
      ctx.lineWidth = this.options.weight;
      ctx.strokeStyle = this.options.gridColor;
      ctx.stroke();
    } else {
      ctx.lineWidth = this.options.weight;
      ctx.strokeStyle = this.options.hkColor;
      ctx.setLineDash(this.options.hkDashArray);
      ctx.stroke();
    }
  }

  getVizGzds() {
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
    let visibleGzds;
    try {
      visibleGzds = getAllVisibleGzds(
        nwBoundMgrs.match(MGRS_REGEX)[GZD_INDEX],
        neBoundMgrs.match(MGRS_REGEX)[GZD_INDEX],
        seBoundMgrs.match(MGRS_REGEX)[GZD_INDEX],
        swBoundMgrs.match(MGRS_REGEX)[GZD_INDEX]
      );
    } catch (e) {
      visibleGzds = null;
    }
    return visibleGzds;
  }

  drawGrid(ctx) {
    if (!this.canvas || !this.map) {
      return;
    }

    if (this.map.getZoom() < this.options.hundredKMinZoom) {
      return;
    }

    ctx.lineWidth = this.options.weight + 0.75;
    ctx.strokeStyle = this.options.gridFontColor;
    ctx.fillStyle = this.options.gridColor;
    ctx.setLineDash(this.options.dashArray);
    ctx.font = this.options.gridFont;
    const visibleGzds = this.getVizGzds();

    const mapBounds = this.map.getBounds();

    // Just return if there's no visible grids.  Possible if the getVizGzds
    // has an exception
    if (!visibleGzds) {
      return;
    }
    visibleGzds.forEach((gzd) => {
      let gzdObject;
      try {
        gzdObject = getGzd(gzd);
      } catch (e) {
        return;
      }

      const gzdWestBoundary = gzdObject[NW_INDEX][LONGITUDE_INDEX];
      const gzdEastBoundary = gzdObject[NE_INDEX][LONGITUDE_INDEX];
      const gzdNorthBoundary = gzdObject[NW_INDEX][LATITUDE_INDEX];
      const gzdSouthBoundary = gzdObject[SW_INDEX][LATITUDE_INDEX];

      // If drawing HK grids, just draw the entire GZD regardless
      const effectiveWestBoundary =
        gzdWestBoundary < mapBounds.getWest() && this.mgrsGridInterval !== 100000
          ? mapBounds.getWest()
          : gzdWestBoundary;
      const effectiveEastBoundary =
        gzdEastBoundary > mapBounds.getEast() && this.mgrsGridInterval !== 100000
          ? mapBounds.getEast()
          : gzdEastBoundary;
      const effectiveNorthBoundary = gzdNorthBoundary > mapBounds.getNorth() ? mapBounds.getNorth() : gzdNorthBoundary;
      const effectiveSouthBoundary = gzdSouthBoundary < mapBounds.getSouth() ? mapBounds.getSouth() : gzdSouthBoundary;

      // Buffer is used to ensure that if we're right on the GZD boundary that we don't get the adjacent GZD
      const buffer = 0.00001;
      const swCornerUtm = llToUtm(effectiveSouthBoundary + buffer, effectiveWestBoundary + buffer);
      const seCornerUtm = llToUtm(effectiveSouthBoundary + buffer, effectiveEastBoundary - buffer);
      const nwCornerUtm = llToUtm(effectiveNorthBoundary - buffer, effectiveWestBoundary + buffer);
      const neCornerUtm = llToUtm(effectiveNorthBoundary - buffer, effectiveEastBoundary - buffer);

      let startingEasting = this.map.getCenter().lat >= 0 ? swCornerUtm.easting : nwCornerUtm.easting;
      let finalEasting = this.map.getCenter().lat >= 0 ? seCornerUtm.easting : neCornerUtm.easting;

      // Since northings are not perfectly horizontal, we need to find the 'largest' northing value
      // in order to make sure that the entire screen has a grid over it
      let startingNorthing = swCornerUtm.northing > seCornerUtm.northing ? seCornerUtm.northing : swCornerUtm.northing;
      let finalNorthing = nwCornerUtm.northing > neCornerUtm.northing ? nwCornerUtm.northing : neCornerUtm.northing;

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
        let initialPlacementCompleted = false;
        ctx.beginPath();
        // HACK - If you navigate to the A/B or X/Y GZDs gzd-utils will crash.  Catch the exception.
        try {
          northingArray.forEach((northingElem, northingIndex, northArr) => {
            let gridIntersectionLl = utmToLl(eastingElem, northingElem, zoneNumber, zoneLetter);

            // The grid array is larger than the GZD.  As such the first and last elements of the easting/northing
            // arrays will be outside of the GZD.  These points are required because they are used to derive the
            // point of intersection with the GZD boundary.
            //******
            // THIS IS WHERE THE BUG IS!!!
            //******
            if (gridIntersectionLl.lng > gzdEastBoundary) {
              return;
            } else if (gridIntersectionLl.lng < gzdWestBoundary) {
              return;
            }
            // This block will truncate the line at the southern boundary of the GZD
            if (gridIntersectionLl.lat < gzdSouthBoundary) {
              let nextIntersectionLl = utmToLl(eastingElem, northArr[northingIndex + 1], zoneNumber, zoneLetter);
              gridIntersectionLl = connectToGzdBoundary(gridIntersectionLl, nextIntersectionLl, 'North');
              // This block will truncate the line at the northern boundary of the GZD
            } else if (gridIntersectionLl.lat > gzdNorthBoundary) {
              let previousIntersectionLl = utmToLl(eastingElem, northArr[northingIndex - 1], zoneNumber, zoneLetter);
              gridIntersectionLl = connectToGzdBoundary(gridIntersectionLl, previousIntersectionLl, 'South');
            }
            let gridIntersectionXy;
            if (Number.isFinite(gridIntersectionLl.lat) && Number.isFinite(gridIntersectionLl.lng)) {
              gridIntersectionXy = this.map.latLngToContainerPoint(gridIntersectionLl);
              if (!initialPlacementCompleted) {
                ctx.moveTo(gridIntersectionXy.x, gridIntersectionXy.y);
                initialPlacementCompleted = true;
              } else {
                ctx.lineTo(gridIntersectionXy.x, gridIntersectionXy.y);
              }
            } else {
              return;
            }
          });
          const notHkLine = eastingElem % 100000 !== 0;
          this._drawLine(ctx, notHkLine);
        } catch (e) {}
      });

      // Lines of constant Northings
      northingArray.forEach((northingElem) => {
        let beginPathCalled = false;
        eastingArray.forEach((eastingElem, eastingIndex, eastArr) => {
          let gridIntersectionLl = utmToLl(eastingElem, northingElem, zoneNumber, zoneLetter);

          // The grid array is larger than the GZD.  As such the first and last elements of the easting/northing
          // arrays will be outside of the GZD.  These points are required because they are used to derive the
          // point of intersection with the GZD boundary.
          if (gridIntersectionLl.lat > gzdNorthBoundary || gridIntersectionLl.lat < gzdSouthBoundary) {
            if (!beginPathCalled) {
              ctx.beginPath();
              beginPathCalled = true;
            }
            return;
          }
          // Need to check to see whether the next point will be inside the GZD if the current point isn't.
          // From there we can truncate the first point so it's on the boundary.
          let gridIntersectionXy = this.map.latLngToContainerPoint(gridIntersectionLl);
          if (!beginPathCalled) {
            // Truncate the line to the effective western boundary
            if (gridIntersectionLl.lng < effectiveWestBoundary) {
              const nextGridIntersectionLl = utmToLl(eastArr[eastingIndex + 1], northingElem, zoneNumber, zoneLetter);
              // If the next intersection isn't inside the boundary, return and try again on the
              // next iteration
              if (nextGridIntersectionLl.lng < effectiveWestBoundary) {
                return;
              }
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
            ctx.beginPath();
            beginPathCalled = true;
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
      // Draw the labels
      if (this.mgrsGridInterval === 100000) {
        eastingArray.forEach((eastingElem, eastingIndex, ea) => {
          northingArray.forEach((northingElem, northingIndex, na) => {
            let labelLl;
            let currentLl = utmToLl(eastingElem, northingElem, zoneNumber, zoneLetter);
            let adjacentLlNorthing;
            let adjacentLlEasting;

            if (ea[eastingIndex + 1]) {
              adjacentLlEasting = utmToLl(ea[eastingIndex + 1], northingElem, zoneNumber, zoneLetter);

              if (adjacentLlEasting.lng > effectiveEastBoundary) {
                const slope = getLineSlope(currentLl, adjacentLlEasting);
                adjacentLlEasting.lat = getAdjustedLatitude(slope, effectiveEastBoundary, adjacentLlEasting);
                adjacentLlEasting.lng = effectiveEastBoundary;
              }
            } else {
              return; // don't care about the very last index
            }

            if (na[northingIndex + 1]) {
              // The west-most HK label would be at a lower latitude than the adjacent east-most HK label.
              // This is because the currentLl has been adjusted to be inside the GZD and as such the easting
              // line needs to be adjusted too.  Rather than doing this, use the next northing in the adjacent
              // easting line.
              if (eastingIndex === 0) {
                adjacentLlNorthing = utmToLl(ea[eastingIndex + 1], na[northingIndex + 1], zoneNumber, zoneLetter);
              } else {
                adjacentLlNorthing = utmToLl(eastingElem, na[northingIndex + 1], zoneNumber, zoneLetter);
              }
            } else {
              return; // don't care about the very last index
            }

            // Boundary check
            if (currentLl.lng < effectiveWestBoundary) {
              const slope = getLineSlope(currentLl, adjacentLlEasting);
              currentLl.lat = getAdjustedLatitude(slope, effectiveWestBoundary, currentLl);
              currentLl.lng = effectiveWestBoundary;
            } else if (currentLl.lng > effectiveEastBoundary) {
              return; // don't care if the cursor is outside the effective bounds
            }

            labelLl = {
              lat: (currentLl.lat + adjacentLlNorthing.lat) / 2,
              lng: (currentLl.lng + adjacentLlEasting.lng) / 2,
            };

            try {
              const effectiveBounds = L.latLngBounds(
                L.latLng(effectiveNorthBoundary, effectiveWestBoundary),
                L.latLng(effectiveSouthBoundary, effectiveEastBoundary)
              );

              if (labelLl && effectiveBounds.contains(labelLl)) {
                let labelText = llToMgrs([labelLl.lng, labelLl.lat]).match(MGRS_REGEX)[HK_INDEX];
                if (
                  this.map
                    .latLngToContainerPoint(L.latLng(currentLl))
                    .distanceTo(this.map.latLngToContainerPoint(L.latLng(adjacentLlEasting))) <
                  ctx.measureText(labelText).width * 2
                ) {
                  return;
                }

                drawLabel(
                  this.ctx,
                  labelText,
                  this.options.gridFontColor,
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

            drawLabel(this.ctx, labelText, this.options.gridFontColor, this.options.gridColor, {
              x: labelXy.x,
              y: labelXy.y - 15,
            });
          }
        });

        northingArray.forEach((northingElem) => {
          let labelXy;
          try {
            let labelLl = utmToLl(eastingArray[eastingArray.length - 1], northingElem, zoneNumber, zoneLetter);

            labelXy = this.map.latLngToContainerPoint({ lat: labelLl.lat, lng: effectiveEastBoundary });
          } catch (e) {
            return;
          }

          let labelText = this._getLabelText(northingElem);

          drawLabel(this.ctx, labelText, this.options.gridFontColor, this.options.gridColor, {
            x: labelXy.x - 15,
            y: labelXy.y,
          });
        });
      }
    });
  }
}

export { MgrsGraticule };
