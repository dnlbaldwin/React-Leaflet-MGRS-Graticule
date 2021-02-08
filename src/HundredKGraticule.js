import { Layer } from 'leaflet';
import { useMap } from 'react-leaflet';
import { forward } from 'mgrs';

import { connectToGzdBoundary, drawLabel, getAdjustedLatitude, getAllVisibleGzds, getLineSlope } from './CommonUtils';

import { getGZD } from 'gzd-utils';

// The following indicies are used to indentify coordinates returned from gzd-utils
const SW_INDEX = 0;
const NW_INDEX = 1;
const NE_INDEX = 2;
const SE_INDEX = 3;

const LATITUDE_INDEX = 1;
const LONGITUDE_INDEX = 0;

const MGRS_REGEX = /([0-9]+[A-Z])([A-Z]{2})(\d+)/;
const GZD_INDEX = 1; //The group index for the 100k identifier in the regex above
const HK_INDEX = 2;

var utmObj = require('utm-latlng');
var utm = new utmObj(); // Defaults to WGS-84

const HundredKGraticule = (props) => {
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
      weight: 2,
      color: '#990000', //Font background colour and dash colour
      font: '15px Courier New',
      fontColor: '#FFFFFF',
      dashArray: [4, 4],
      eastingArray: [],
      northingArray: [],
      minZoom: 6, //Must be at least at this zoom to see the graticules
      maxZoom: 10,
    };

    this.options = (props && props.options) || this.defaultOptions;

    this.map = props.map;
    this.canvas = props.canvas;
    this.northingArray = [];
    this.eastingArray = [];

    this.HUNDRED_K_GRID_INTERVAL = 100000;
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

  /**
   * Called whenever the map is moved.  Redraws the grids.
   */
  reset() {
    const MAP_SIZE = this.map.getSize();
    const MAP_TOP_LEFT = this.map.containerPointToLayerPoint([0, 0]);

    this.canvas.style['transform'] = `translate3d(${MAP_TOP_LEFT.x}px,${MAP_TOP_LEFT.y}px,0)`;

    this.canvas.width = MAP_SIZE.x;
    this.canvas.height = MAP_SIZE.y;
    const ZOOM = this.map.getZoom();

    if (ZOOM > this.options.minZoom && ZOOM < this.options.maxZoom) {
      let visibleGrids = this.getVizGrids();

      this.eastingArray = [];
      this.northingArray = [];
      this.generateGrids(visibleGrids);
    }
  }

  getVizGrids() {
    const NW_BOUND_MGRS = forward(
      [this.map.getBounds().getNorthWest()['lng'], this.map.getBounds().getNorthWest()['lat']],
      1
    );
    const NE_BOUND_MGRS = forward(
      [this.map.getBounds().getNorthEast()['lng'], this.map.getBounds().getNorthEast()['lat']],
      1
    );
    const SE_BOUND_MGRS = forward(
      [this.map.getBounds().getSouthEast()['lng'], this.map.getBounds().getSouthEast()['lat']],
      1
    );
    const SW_BOUND_MGRS = forward(
      [this.map.getBounds().getSouthWest()['lng'], this.map.getBounds().getSouthWest()['lat']],
      1
    );

    let visibleGrids = getAllVisibleGzds(
      NW_BOUND_MGRS.match(MGRS_REGEX)[GZD_INDEX],
      NE_BOUND_MGRS.match(MGRS_REGEX)[GZD_INDEX],
      SE_BOUND_MGRS.match(MGRS_REGEX)[GZD_INDEX],
      SW_BOUND_MGRS.match(MGRS_REGEX)[GZD_INDEX]
    );

    return visibleGrids;
  }

  getPaddingOnZoomLevel(currentZoom) {
    switch (currentZoom) {
      case 17:
        return 60;
      case 16:
        return 60;
      case 15:
        return 60;
      case 14:
        return 30;
      case 13:
        return 15;
      case 12:
        return 7;
      case 11:
        return 4;
      case 10:
        return 3;
      case 9:
        return 3;
      case 8:
        return 3;
      case 7:
        return 3;
      case 6:
        return 1;
      default:
        return 1; //TODO - Modify according to what I set the maxZoom for 100k to be
    }
  }

  handle31VLabels(ctx, adjustedLl, coordinateLl) {
    const HALF_DEGREE = 0.5; // Approximate distance used to centre the label in the middle of the HK zone
    const LABEL_XY = this.map.latLngToContainerPoint({
      lat: (adjustedLl.lat + coordinateLl.lat) / 2 + HALF_DEGREE,
      lng: (adjustedLl.lng + coordinateLl.lng) / 2,
    });

    // This is extra label text
    const LABEL_TEXT = forward([
      (adjustedLl.lng + coordinateLl.lng) / 2,
      (adjustedLl.lat + coordinateLl.lat) / 2 + HALF_DEGREE,
    ]).match(MGRS_REGEX)[HK_INDEX];

    drawLabel(ctx, LABEL_TEXT, this.options.fontColor, this.options.color, LABEL_XY);
  }

  handle31V(ctx, elemUtm, coordinateLl) {
    const ZONE_BOUNDARIES = getGZD('31V');
    const WEST_GZD_LONGITUDE = ZONE_BOUNDARIES['geometry']['coordinates'][0][NW_INDEX][LONGITUDE_INDEX];
    const EAST_GZD_LONGITUDE = ZONE_BOUNDARIES['geometry']['coordinates'][0][NE_INDEX][LONGITUDE_INDEX];

    // 60km east of elem at the same northing - The shortest segment was measured to be around 65k
    const TEMP_POINT_LL = utm.convertUtmToLatLng(
      elemUtm.easting + 60000,
      elemUtm.northing,
      elemUtm.zoneNumber,
      elemUtm.zoneLetter
    );

    const SLOPE = getLineSlope(coordinateLl, TEMP_POINT_LL);

    // From the line slope derive the intersecting point with the GZD boundary
    const ADJUSTED_EAST_LATITUDE = getAdjustedLatitude(SLOPE, EAST_GZD_LONGITUDE, TEMP_POINT_LL);

    const EAST_GZD_BOUNDARY_POINT = this.map.latLngToContainerPoint({
      lat: ADJUSTED_EAST_LATITUDE,
      lng: EAST_GZD_LONGITUDE,
    });

    // Derive the west intersecting point using the same slope.
    const ADJUSTED_WEST_LATITUDE = getAdjustedLatitude(SLOPE, WEST_GZD_LONGITUDE, TEMP_POINT_LL);

    const WEST_GZD_BOUNDARY_POINT = this.map.latLngToContainerPoint({
      lat: ADJUSTED_WEST_LATITUDE,
      lng: WEST_GZD_LONGITUDE,
    });
    ctx.moveTo(WEST_GZD_BOUNDARY_POINT.x, WEST_GZD_BOUNDARY_POINT.y);
    ctx.lineTo(EAST_GZD_BOUNDARY_POINT.x, EAST_GZD_BOUNDARY_POINT.y);

    // Eastern 31V Labels
    this.handle31VLabels(ctx, { lat: ADJUSTED_EAST_LATITUDE, lng: EAST_GZD_LONGITUDE }, coordinateLl);

    // Western 31V Labels
    this.handle31VLabels(ctx, { lat: ADJUSTED_WEST_LATITUDE, lng: WEST_GZD_LONGITUDE }, coordinateLl);
  }

  processEastingsAndNorthings(startingNorthingUtm, startingEastingUtm, finalNorthingUtm, finalEastingUtm) {
    let northingIterator = startingNorthingUtm.Northing;
    let eastingIterator = startingEastingUtm.Easting;

    //Round to nearest 100k metres -- the loop will need to iterate to there anyways
    northingIterator = Math.ceil(northingIterator / this.HUNDRED_K_GRID_INTERVAL) * this.HUNDRED_K_GRID_INTERVAL;
    eastingIterator = Math.ceil(eastingIterator / this.HUNDRED_K_GRID_INTERVAL) * this.HUNDRED_K_GRID_INTERVAL;

    // HACK - Workaround for conversion error
    if (startingNorthingUtm.ZoneNumber.toString() + startingNorthingUtm.ZoneLetter === '31W') {
      northingIterator = 7100000; // Round down for special case
    }

    // Find all northing grids that are divisible by 100,000
    if (startingNorthingUtm.ZoneLetter === finalNorthingUtm.ZoneLetter) {
      while (northingIterator <= finalNorthingUtm.Northing) {
        // This loop checks to make sure the easting grid is divisible by 100K
        if (northingIterator % this.HUNDRED_K_GRID_INTERVAL === 0) {
          this.northingArray.push({
            northing: northingIterator,
            zoneNumber: startingNorthingUtm.ZoneNumber,
            zoneLetter: startingNorthingUtm.ZoneLetter,
          });
        }
        northingIterator += this.HUNDRED_K_GRID_INTERVAL;
      }
    }
    // Find all easting grids that are divisible by 100,000
    if (startingEastingUtm.ZoneLetter === finalEastingUtm.ZoneLetter) {
      while (eastingIterator <= finalEastingUtm.Easting) {
        if (eastingIterator % this.HUNDRED_K_GRID_INTERVAL === 0) {
          this.eastingArray.push({
            easting: eastingIterator,
            zoneNumber: startingEastingUtm.ZoneNumber,
            zoneLetter: startingEastingUtm.ZoneLetter,
          });
        }
        eastingIterator += this.HUNDRED_K_GRID_INTERVAL;
      }
    }
  }

  processGridIntersection(mapBounds, eastingElem, northingElem) {
    if (eastingElem.zoneNumber === northingElem.zoneNumber && eastingElem.zoneLetter === northingElem.zoneLetter) {
      const GRID_INTERSECTION = {
        northing: northingElem.northing,
        easting: eastingElem.easting,
        zoneNumber: northingElem.zoneNumber,
        zoneLetter: northingElem.zoneLetter,
      };

      if (
        mapBounds.contains(
          utm.convertUtmToLatLng(
            GRID_INTERSECTION.easting,
            GRID_INTERSECTION.northing,
            GRID_INTERSECTION.zoneNumber,
            GRID_INTERSECTION.zoneLetter
          )
        )
      ) {
        return GRID_INTERSECTION;
      }
    }
  }

  handleEquatorLabels(ctx, firstIntersection, secondIntersection) {
    let labelCoordinateLl = utm.convertUtmToLatLng(
      Math.floor((firstIntersection.easting + secondIntersection.easting) / 2),
      Math.floor(firstIntersection.northing - 50000),
      firstIntersection.zoneNumber,
      firstIntersection.zoneLetter
    );

    let labelText = forward([labelCoordinateLl.lng, labelCoordinateLl.lat]).match(MGRS_REGEX)[HK_INDEX];

    drawLabel(
      ctx,
      labelText,
      this.options.fontColor,
      this.options.color,
      this.map.latLngToContainerPoint({
        lat: labelCoordinateLl.lat,
        lng: labelCoordinateLl.lng,
      })
    );
  }

  generateGrids(visibleGzds) {
    let ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.lineWidth = this.options.weight;
    ctx.strokeStyle = this.options.color;
    ctx.fillStyle = this.options.color;
    ctx.setLineDash(this.options.dashArray);
    ctx.font = this.options.font;

    visibleGzds.forEach((gzd) => {
      // Get Lat/Long bounds for each GZD
      let zoneBoundaries;
      try {
        zoneBoundaries = getGZD(gzd);
      } catch (error) {
        return; //Invalid MGRS value returned, so no need to try to display the grid
      }

      const SW_CORNER_LL = zoneBoundaries['geometry']['coordinates'][0][SW_INDEX];
      const NW_CORNER_LL = zoneBoundaries['geometry']['coordinates'][0][NW_INDEX];
      const NE_CORNER_LL = zoneBoundaries['geometry']['coordinates'][0][NE_INDEX];
      const SE_CORNER_LL = zoneBoundaries['geometry']['coordinates'][0][SE_INDEX];

      const UTM_RESOLUTION = 0; //No decimal places when returning the UTM location

      const BUFFER = 0.00001; // HACK - This buffer shrinks the UTM.  Very magical.

      //BUG - Incorrect conversion from LL to UTM in the SW corner of the 33V GZD will make
      // it think that it is in the 32V GZD.  Without manually setting it the algorithm will
      // create a second set of lines over Norway and leave Sweden blank.
      const SW_CORNER_UTM =
        gzd === '33V'
          ? {
              ZoneLetter: 'V',
              ZoneNumber: 33,
              Easting: 312900,
              Northing: 6210142,
            }
          : utm.convertLatLngToUtm(
              SW_CORNER_LL[LATITUDE_INDEX] + BUFFER,
              SW_CORNER_LL[LONGITUDE_INDEX] + BUFFER,
              UTM_RESOLUTION
            );
      const NW_CORNER_UTM = utm.convertLatLngToUtm(
        NW_CORNER_LL[LATITUDE_INDEX] - BUFFER,
        NW_CORNER_LL[LONGITUDE_INDEX] + BUFFER,
        UTM_RESOLUTION
      );
      const NE_CORNER_UTM = utm.convertLatLngToUtm(
        NE_CORNER_LL[LATITUDE_INDEX] - BUFFER,
        NE_CORNER_LL[LONGITUDE_INDEX] - BUFFER,
        UTM_RESOLUTION
      );
      const SE_CORNER_UTM = utm.convertLatLngToUtm(
        SE_CORNER_LL[LATITUDE_INDEX] + BUFFER,
        SE_CORNER_LL[LONGITUDE_INDEX] - BUFFER,
        UTM_RESOLUTION
      );

      const HEMISPHERE = this.map.getCenter().lat <= 0 ? 'South' : 'North';

      switch (HEMISPHERE) {
        case 'North':
          this.processEastingsAndNorthings(SW_CORNER_UTM, SW_CORNER_UTM, NE_CORNER_UTM, SE_CORNER_UTM);
          break;
        case 'South':
          this.processEastingsAndNorthings(SW_CORNER_UTM, NW_CORNER_UTM, NE_CORNER_UTM, NE_CORNER_UTM);
          break;
        default:
          break;
      }
    });

    const MAP_BOUNDS = this.map.getBounds().pad(this.getPaddingOnZoomLevel(this.map.getZoom()));
    this.northingArray.forEach((northingElem) => {
      let northingGridsArray = [];

      this.eastingArray.forEach((eastingElem) => {
        let intersection = this.processGridIntersection(MAP_BOUNDS, eastingElem, northingElem);
        if (intersection) {
          northingGridsArray.push(intersection);
        }
      });

      northingGridsArray.forEach((elem, index, array) => {
        let COORDINATE_LL = utm.convertUtmToLatLng(elem.easting, elem.northing, elem.zoneNumber, elem.zoneLetter);

        let COORDINATE_XY = this.map.latLngToContainerPoint({
          lat: COORDINATE_LL.lat,
          lng: COORDINATE_LL.lng,
        });

        let gzd = elem.zoneNumber.toString() + elem.zoneLetter;
        // Since there is only one northing array in zone 31V, we need to treat this zone
        // specially.  For each point in 31V, we will traverse the grid horizontally in
        // order to get a second point to derive a line from. From there it will be expanded
        // to cover the entire GZD.
        if (gzd === '31V') {
          this.handle31V(ctx, elem, COORDINATE_LL);
        } else {
          if (index === 0) {
            if (northingGridsArray[index]) {
              const NEXT_COORDINATE_LL = utm.convertUtmToLatLng(
                northingGridsArray[index].easting,
                northingGridsArray[index].northing,
                northingGridsArray[index].zoneNumber,
                northingGridsArray[index].zoneLetter
              );

              // Get Lat/Long bounds for each GZD
              const WEST_GZD_LONGITUDE = getGZD(gzd)['geometry']['coordinates'][0][NW_INDEX][LONGITUDE_INDEX];

              // If the first point is west of the GZD western boundary
              if (COORDINATE_LL.lng < WEST_GZD_LONGITUDE) {
                let slope = getLineSlope(COORDINATE_LL, NEXT_COORDINATE_LL);

                let adjustedLatitude = getAdjustedLatitude(slope, WEST_GZD_LONGITUDE, NEXT_COORDINATE_LL);

                COORDINATE_XY = this.map.latLngToContainerPoint({
                  lat: adjustedLatitude,
                  lng: WEST_GZD_LONGITUDE,
                });
                // If the first point is east of the GZD western boundary
              } else if (COORDINATE_LL.lng > WEST_GZD_LONGITUDE) {
                let additionalPoint = connectToGzdBoundary(COORDINATE_LL, NEXT_COORDINATE_LL, 'West');

                let cachedCoordinateXy = COORDINATE_XY; // Used to determine whether we actually display the label

                COORDINATE_XY = this.map.latLngToContainerPoint({
                  lat: additionalPoint.lat,
                  lng: additionalPoint.lng,
                });

                // This is extra label text
                let labelText = forward([additionalPoint.lng, additionalPoint.lat]).match(MGRS_REGEX)[HK_INDEX];

                let labelWidth = ctx.measureText(labelText).width;

                // If the label is wider than the zone it represents (with a scale factor), don't display
                if (Math.abs(cachedCoordinateXy.x - COORDINATE_XY.x) / 1.5 > labelWidth) {
                  drawLabel(
                    ctx,
                    labelText,
                    this.options.fontColor,
                    this.options.color,
                    this.map.latLngToContainerPoint({
                      lat: Math.abs(additionalPoint.lng - COORDINATE_LL.lng) / 2 + additionalPoint.lat,
                      lng: (additionalPoint.lng + COORDINATE_LL.lng) / 2,
                    })
                  );
                }

                // Handle a special case in a GZD adjacent to the Norway special zones
                if (labelText === 'LT' && gzd === '32W') {
                  labelText = forward([
                    (additionalPoint.lng + COORDINATE_LL.lng) / 2,
                    Math.abs(additionalPoint.lng - COORDINATE_LL.lng) / 2 - additionalPoint.lat,
                  ]).match(MGRS_REGEX)[HK_INDEX];

                  labelWidth = ctx.measureText(labelText).width;

                  // If the label is wider than the zone it represents (with a scale factor), don't display
                  if (Math.abs(cachedCoordinateXy.x - COORDINATE_XY.x) / 1.5 > labelWidth) {
                    drawLabel(
                      ctx,
                      labelText,
                      this.options.fontColor,
                      this.options.color,
                      this.map.latLngToContainerPoint({
                        lat: additionalPoint.lat - Math.abs(additionalPoint.lng - COORDINATE_LL.lng) / 2,
                        lng: (additionalPoint.lng + COORDINATE_LL.lng) / 2,
                      })
                    );
                  }
                }
              }

              let labelCoordinateLl = utm.convertUtmToLatLng(
                Math.floor((northingGridsArray[index].easting + northingGridsArray[index + 1].easting) / 2),
                Math.floor(northingGridsArray[index].northing + 50000),
                northingGridsArray[index].zoneNumber,
                northingGridsArray[index].zoneLetter
              );

              let labelText = forward([labelCoordinateLl.lng, labelCoordinateLl.lat]).match(MGRS_REGEX)[HK_INDEX];

              if (!(labelText === 'EM' && gzd === '32V')) {
                drawLabel(
                  ctx,
                  labelText,
                  this.options.fontColor,
                  this.options.color,
                  this.map.latLngToContainerPoint({
                    lat: labelCoordinateLl.lat,
                    lng: labelCoordinateLl.lng,
                  })
                );
              }

              if (elem.zoneLetter === 'N') {
                this.handleEquatorLabels(ctx, northingGridsArray[index], northingGridsArray[index + 1]);
              }
            }
            ctx.beginPath();

            ctx.moveTo(COORDINATE_XY.x, COORDINATE_XY.y);
          } else {
            // Last element in the northing grids array
            if (index === array.length - 1) {
              const EAST_GZD_LONGITUDE = getGZD(gzd)['geometry']['coordinates'][0][NE_INDEX][LONGITUDE_INDEX];
              const PREV_COORDINATE_LL = utm.convertUtmToLatLng(
                northingGridsArray[index - 1].easting,
                northingGridsArray[index - 1].northing,
                northingGridsArray[index - 1].zoneNumber,
                northingGridsArray[index - 1].zoneLetter
              );
              // The final point is to the east of the eastern GZD boundary, so it needs
              // to be moved back to the boundary
              if (COORDINATE_LL.lng > EAST_GZD_LONGITUDE) {
                let slope = getLineSlope(COORDINATE_LL, PREV_COORDINATE_LL);

                let adjustedLatitude = getAdjustedLatitude(slope, EAST_GZD_LONGITUDE, PREV_COORDINATE_LL);

                COORDINATE_XY = this.map.latLngToContainerPoint({
                  lat: adjustedLatitude,
                  lng: EAST_GZD_LONGITUDE,
                });
                // The final point is to the west of the eastern GZD boundary, so another
                // point needs to be made to account for the additional 100k zone
              } else if (COORDINATE_LL.lng <= EAST_GZD_LONGITUDE) {
                let additionalPoint = connectToGzdBoundary(COORDINATE_LL, PREV_COORDINATE_LL, 'East');

                let cachedCoordinateXy = COORDINATE_XY; // Used to determine whether we actually display the label

                COORDINATE_XY = this.map.latLngToContainerPoint({
                  lat: additionalPoint.lat,
                  lng: additionalPoint.lng,
                });

                // This is extra label text
                let labelText = forward([COORDINATE_LL.lng, COORDINATE_LL.lat]).match(MGRS_REGEX)[HK_INDEX];

                let labelWidth = ctx.measureText(labelText).width;

                // If the label is wider than the zone it represents (with a scale factor), don't display
                if (Math.abs(cachedCoordinateXy.x - COORDINATE_XY.x) / 1.5 > labelWidth) {
                  drawLabel(
                    ctx,
                    labelText,
                    this.options.fontColor,
                    this.options.color,
                    this.map.latLngToContainerPoint({
                      lat: Math.abs(additionalPoint.lng - COORDINATE_LL.lng) / 2 + additionalPoint.lat,
                      lng: (additionalPoint.lng + COORDINATE_LL.lng) / 2,
                    })
                  );
                }
              }

              let labelCoordinateLl = utm.convertUtmToLatLng(
                Math.floor((northingGridsArray[index].easting + northingGridsArray[index - 1].easting) / 2),
                Math.floor(northingGridsArray[index].northing + 50000),
                northingGridsArray[index].zoneNumber,
                northingGridsArray[index].zoneLetter
              );

              let labelText = forward([labelCoordinateLl.lng, labelCoordinateLl.lat]).match(MGRS_REGEX)[HK_INDEX];

              drawLabel(
                ctx,
                labelText,
                this.options.fontColor,
                this.options.color,
                this.map.latLngToContainerPoint({
                  lat: labelCoordinateLl.lat,
                  lng: labelCoordinateLl.lng,
                })
              );
            } else {
              let labelCoordinateLl = utm.convertUtmToLatLng(
                Math.floor((northingGridsArray[index].easting + northingGridsArray[index + 1].easting) / 2),
                Math.floor(northingGridsArray[index].northing + 50000),
                northingGridsArray[index].zoneNumber,
                northingGridsArray[index].zoneLetter
              );

              let labelText = forward([labelCoordinateLl.lng, labelCoordinateLl.lat]).match(MGRS_REGEX)[HK_INDEX];
              if (!(labelText === 'FM' && gzd === '32V')) {
                drawLabel(
                  ctx,
                  labelText,
                  this.options.fontColor,
                  this.options.color,
                  this.map.latLngToContainerPoint({
                    lat: labelCoordinateLl.lat,
                    lng: labelCoordinateLl.lng,
                  })
                );
              }

              if (elem.zoneLetter === 'N') {
                this.handleEquatorLabels(ctx, northingGridsArray[index], northingGridsArray[index + 1]);
              }
            }
            ctx.lineTo(COORDINATE_XY.x, COORDINATE_XY.y);
          }
        }
      });
      ctx.stroke();
    });

    this.eastingArray.forEach((eastingElem) => {
      let eastingGridsArray = [];

      this.northingArray.forEach((northingElem) => {
        let intersection = this.processGridIntersection(MAP_BOUNDS, eastingElem, northingElem);
        if (intersection) {
          eastingGridsArray.push(intersection);
        }
      });
      let shouldSkip = false; // Can't break out of a forEach loop using 'break'
      eastingGridsArray.forEach((elem, index, array) => {
        if (shouldSkip) {
          return;
        }

        let COORDINATE_LL = utm.convertUtmToLatLng(elem.easting, elem.northing, elem.zoneNumber, elem.zoneLetter);

        let COORDINATE_XY = this.map.latLngToContainerPoint({
          lat: COORDINATE_LL.lat,
          lng: COORDINATE_LL.lng,
        });

        let gzd = elem.zoneNumber.toString() + elem.zoneLetter;

        const SW_GZD_POINT = getGZD(gzd)['geometry']['coordinates'][0][SW_INDEX];

        // The first index in the array of northings
        if (index === 0) {
          ctx.beginPath();

          // If the first northing coordinate is north of the south boundary of the GZD,
          // we need to extend a line to touch the bottom of the GZD
          if (COORDINATE_LL.lat > SW_GZD_POINT[LATITUDE_INDEX] && eastingGridsArray[index + 1]) {
            const NEXT_COORDINATE_LL = utm.convertUtmToLatLng(
              eastingGridsArray[index + 1].easting,
              eastingGridsArray[index + 1].northing,
              eastingGridsArray[index + 1].zoneNumber,
              eastingGridsArray[index + 1].zoneLetter
            );

            let adjustedPoint = connectToGzdBoundary(COORDINATE_LL, NEXT_COORDINATE_LL, 'South');

            COORDINATE_XY = this.map.latLngToContainerPoint({
              lat: adjustedPoint.lat,
              lng: adjustedPoint.lng,
            });
          }
          ctx.moveTo(COORDINATE_XY.x, COORDINATE_XY.y);
        } else {
          // Get Lat/Long bounds for each GZD
          const NE_GZD_POINT = getGZD(gzd)['geometry']['coordinates'][0][NE_INDEX];

          const PREV_COORDINATE_LL = utm.convertUtmToLatLng(
            eastingGridsArray[index - 1].easting,
            eastingGridsArray[index - 1].northing,
            eastingGridsArray[index - 1].zoneNumber,
            eastingGridsArray[index - 1].zoneLetter
          );

          let slope = getLineSlope(COORDINATE_LL, PREV_COORDINATE_LL);
          // If the point in the easting array is outside of its GZD, calculate the slope
          // of the line with the previous point in the array and adjust the end point latitude
          // as if it were resting right on the GZD boundary.
          if (COORDINATE_LL.lng <= SW_GZD_POINT[LONGITUDE_INDEX]) {
            COORDINATE_XY = this.getAdjustedXy(slope, SW_GZD_POINT[LONGITUDE_INDEX], PREV_COORDINATE_LL);
            // If the value is outside of the GZD, then all subsequent ones will be too
            // This means they do not need to be displayed.  You can't break out of a
            // forEach loop, so using a boolean instead.
            shouldSkip = true;
          } else if (COORDINATE_LL.lng > NE_GZD_POINT[LONGITUDE_INDEX]) {
            COORDINATE_XY = this.getAdjustedXy(slope, NE_GZD_POINT[LONGITUDE_INDEX], PREV_COORDINATE_LL);

            shouldSkip = true;
          }

          ctx.lineTo(COORDINATE_XY.x, COORDINATE_XY.y);
          // Connect to the GZD northern boundary
          if (array.length - 1 === index && COORDINATE_LL.lat < NE_GZD_POINT[LATITUDE_INDEX]) {
            let adjustedPoint = connectToGzdBoundary(COORDINATE_LL, PREV_COORDINATE_LL, 'North');
            COORDINATE_XY = this.map.latLngToContainerPoint({
              lat: adjustedPoint.lat,
              lng: adjustedPoint.lng,
            });

            ctx.lineTo(COORDINATE_XY.x, COORDINATE_XY.y);
          }
        }
      });
      ctx.stroke();
    });
  }

  // Small wrapper function to get the adjusted XY coordinates for when a HK point
  // lies west/east of the GZD boundary
  getAdjustedXy(slope, boundaryPoint, coordinateLl) {
    let adjustedLatitude = getAdjustedLatitude(slope, boundaryPoint, coordinateLl);

    let COORDINATE_XY = this.map.latLngToContainerPoint({
      lat: adjustedLatitude,
      lng: boundaryPoint,
    });
    return COORDINATE_XY;
  }
}

export { HundredKGraticule };
