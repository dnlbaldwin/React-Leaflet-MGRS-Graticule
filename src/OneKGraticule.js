import { Layer } from "leaflet";
import { useMap } from "react-leaflet";
import {
  connectToGzdBoundary,
  drawLabel,
  getAllVisibleGzds,
  latLngToCanvasPoint,
} from "./CommonUtils";
import { getGZD } from "gzd-utils";
import { forward } from "mgrs";

// The following indicies are used to indentify coordinates returned from gzd-utils
const SW_INDEX = 0;
const NW_INDEX = 1;
const NE_INDEX = 2;

const LATITUDE_INDEX = 1;
const LONGITUDE_INDEX = 0;

const MGRS_REGEX = /([0-9]+[A-Z])([A-Z]{2})(\d+)/;
const GZD_INDEX = 1;

var utmObj = require("utm-latlng");
var utm = new utmObj(); // Defaults to WGS-84

const OneKGraticule = (props) => {
  let map = useMap();

  const canvas = document.createElement("canvas");
  canvas.classList.add("leaflet-zoom-animated");

  let g = new Graticule({ map: map, canvas: canvas });
  map.addLayer(g);

  return null;
};
class Graticule extends Layer {
  constructor(props) {
    super(props);

    this.updateVariables = this.updateVariables.bind(this);

    this.defaultOptions = {
      showGrid: true, // TODO - control grid visibility with this
      showLabel: true,
      opacity: 10,
      weight: 1.5,
      color: "#000",
      hkColor: "#990000", //Font background colour and dash colour
      hkDashArray: [4, 4],
      font: "14px Courier New",
      fontColor: "#FFF",
      dashArray: [],
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
    map.on("viewreset", this.reset, this);
    map.on("move", this.reset, this);

    this.reset();
  }

  onRemove(map) {
    map._panes.overlayPane.removeChild(this.canvas);
    map.off("viewreset", this.reset, this);
    map.off("move", this.reset, this);

    this.canvas = null;
    this.map = null;
  }

  reset() {
    const MAP_SIZE = this.map.getSize();
    const MAP_LEFT_TOP = this.map.containerPointToLayerPoint([0, 0]);

    this.canvas._leaflet_pos = MAP_LEFT_TOP;

    this.canvas.style[
      "transform"
    ] = `translate3d(${MAP_LEFT_TOP.x}px,${MAP_LEFT_TOP.y}px,0)`;

    this.canvas.width = MAP_SIZE.x;
    this.canvas.height = MAP_SIZE.y;

    if (this.map.getZoom() > this.options.oneKMinZoom) {
      this.mgrsGridInterval = 1000; //1k resolution
    } else if (this.map.getZoom() > this.options.tenKMinZoom) {
      this.mgrsGridInterval = 10000; //10k resolution
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

    if (this.mgrsGridInterval === 10000 && label === "0") {
      label = "00";
    }

    return label;
  }

  _drawLine(ctx, hkLine) {
    if (hkLine) {
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
    const NW_BOUND_MGRS = forward(
      [
        this.map.getBounds().getNorthWest()["lng"],
        this.map.getBounds().getNorthWest()["lat"],
      ],
      1
    );
    const NE_BOUND_MGRS = forward(
      [
        this.map.getBounds().getNorthEast()["lng"],
        this.map.getBounds().getNorthEast()["lat"],
      ],
      1
    );
    const SE_BOUND_MGRS = forward(
      [
        this.map.getBounds().getSouthEast()["lng"],
        this.map.getBounds().getSouthEast()["lat"],
      ],
      1
    );
    const SW_BOUND_MGRS = forward(
      [
        this.map.getBounds().getSouthWest()["lng"],
        this.map.getBounds().getSouthWest()["lat"],
      ],
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

  drawGrid() {
    if (!this.canvas || !this.map) {
      return;
    }

    if (this.map.getZoom() < this.options.tenKMinZoom) {
      return;
    }

    let ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.lineWidth = this.options.weight + 0.75;
    ctx.strokeStyle = "#FFF";
    ctx.fillStyle = this.options.color;
    ctx.setLineDash(this.options.dashArray);
    ctx.font = this.options.font;
    const VISIBLE_GZDS = this.getVizGrids();

    const MAP_BOUNDS = this.map.getBounds();

    VISIBLE_GZDS.forEach((gzd, gzdIndex, visibleGridArr) => {
      const GZD_OBJECT = getGZD(gzd);
      const GZD_WEST_BOUNDARY =
        GZD_OBJECT["geometry"]["coordinates"][0][NW_INDEX][LONGITUDE_INDEX];
      const GZD_EAST_BOUNDARY =
        GZD_OBJECT["geometry"]["coordinates"][0][NE_INDEX][LONGITUDE_INDEX];
      const GZD_NORTH_BOUNDARY =
        GZD_OBJECT["geometry"]["coordinates"][0][NW_INDEX][LATITUDE_INDEX];
      const GZD_SOUTH_BOUNDARY =
        GZD_OBJECT["geometry"]["coordinates"][0][SW_INDEX][LATITUDE_INDEX];

      let effectiveWestGzdBoundary =
        GZD_WEST_BOUNDARY < MAP_BOUNDS.getWest()
          ? MAP_BOUNDS.getWest()
          : GZD_WEST_BOUNDARY;
      let effectiveEastGzdBoundary =
        GZD_EAST_BOUNDARY > MAP_BOUNDS.getEast()
          ? MAP_BOUNDS.getEast()
          : GZD_EAST_BOUNDARY;
      let effectiveWNorthGzdBoundary =
        GZD_NORTH_BOUNDARY > MAP_BOUNDS.getNorth()
          ? MAP_BOUNDS.getNorth()
          : GZD_NORTH_BOUNDARY;
      let effectiveSouthGzdBoundary =
        GZD_SOUTH_BOUNDARY < MAP_BOUNDS.getSouth()
          ? MAP_BOUNDS.getSouth()
          : GZD_SOUTH_BOUNDARY;

      const BUFFER = 0.00001;
      const SW_CORNER_UTM = utm.convertLatLngToUtm(
        effectiveSouthGzdBoundary + BUFFER,
        effectiveWestGzdBoundary + BUFFER,
        0
      );
      const SE_CORNER_UTM = utm.convertLatLngToUtm(
        effectiveSouthGzdBoundary + BUFFER,
        effectiveEastGzdBoundary - BUFFER,
        0
      );
      const NW_CORNER_UTM = utm.convertLatLngToUtm(
        effectiveWNorthGzdBoundary - BUFFER,
        effectiveWestGzdBoundary + BUFFER,
        0
      );
      const NE_CORNER_UTM = utm.convertLatLngToUtm(
        effectiveWNorthGzdBoundary - BUFFER,
        effectiveEastGzdBoundary - BUFFER,
        0
      );

      // Draw easting lines
      let startingEasting = SW_CORNER_UTM.Easting;
      let finalEasting = SE_CORNER_UTM.Easting;

      let startingNorthing = SW_CORNER_UTM.Northing;
      let finalNorthing = NE_CORNER_UTM.Northing;

      startingEasting =
        Math.floor(startingEasting / this.mgrsGridInterval) *
        this.mgrsGridInterval;
      finalEasting =
        Math.floor(finalEasting / this.mgrsGridInterval) *
        this.mgrsGridInterval;
      startingNorthing =
        Math.floor(startingNorthing / this.mgrsGridInterval) *
        this.mgrsGridInterval;
      finalNorthing =
        Math.ceil(finalNorthing / this.mgrsGridInterval) *
        this.mgrsGridInterval;

      let eastingArray = [];
      for (
        let i = startingEasting;
        i <= finalEasting;
        i += this.mgrsGridInterval
      ) {
        eastingArray.push(i);
      }

      let northingArray = [];
      for (
        let i = startingNorthing;
        i <= finalNorthing;
        i += this.mgrsGridInterval
      ) {
        northingArray.push(i);
      }
      let zoneLetter = NW_CORNER_UTM.ZoneLetter;
      let zoneNumber = NW_CORNER_UTM.ZoneNumber;
      // Lines of constant Eastings
      eastingArray.forEach((eastingElem, eastingIndex, eastArr) => {
        let shouldSkip = false;

        northingArray.forEach((northingElem, northingIndex, northArr) => {
          if (shouldSkip) {
            return;
          }
          let gridIntersectionLl = utm.convertUtmToLatLng(
            eastingElem,
            northingElem,
            zoneNumber,
            zoneLetter
          );
          if (
            gridIntersectionLl.lng < GZD_WEST_BOUNDARY ||
            gridIntersectionLl.lng > GZD_EAST_BOUNDARY
          ) {
            return; //No need to draw this because it's outside the GZD - floor calculation from above.
          }

          if (gridIntersectionLl.lat < GZD_SOUTH_BOUNDARY) {
            let nextIntersectionLl = utm.convertUtmToLatLng(
              eastingElem,
              northArr[northingIndex + 1],
              zoneNumber,
              zoneLetter
            );
            gridIntersectionLl = connectToGzdBoundary(
              gridIntersectionLl,
              nextIntersectionLl,
              "North"
            );
          }

          let gridIntersectionXy;
          if (gridIntersectionLl) {
            gridIntersectionXy = latLngToCanvasPoint(
              this.map,
              gridIntersectionLl
            );
          } else {
            return;
          }

          if (northingIndex === 0) {
            ctx.beginPath();
            ctx.moveTo(gridIntersectionXy.x, gridIntersectionXy.y);
          } else {
            if (gridIntersectionLl.lng > GZD_EAST_BOUNDARY) {
              shouldSkip = true;
            }

            if (gridIntersectionLl.lat > GZD_NORTH_BOUNDARY) {
              let previousIntersectionLl = utm.convertUtmToLatLng(
                eastingElem,
                northArr[northingIndex - 1],
                zoneNumber,
                zoneLetter
              );

              gridIntersectionLl = connectToGzdBoundary(
                gridIntersectionLl,
                previousIntersectionLl,
                "South"
              );

              gridIntersectionXy = latLngToCanvasPoint(
                this.map,
                gridIntersectionLl
              );
            }
            ctx.lineTo(gridIntersectionXy.x, gridIntersectionXy.y);
          }
        });

        const IS_HK_LINE = eastingElem % 100000 !== 0;
        this._drawLine(ctx, IS_HK_LINE);

        let gridLabelLl = utm.convertUtmToLatLng(
          eastingElem,
          northingArray[1],
          zoneNumber,
          zoneLetter
        );

        if (gridLabelLl.lng > GZD_WEST_BOUNDARY) {
          try {
            let gridLabelXy = latLngToCanvasPoint(this.map, {
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
          let gridIntersectionLl = utm.convertUtmToLatLng(
            eastingElem,
            northingElem,
            zoneNumber,
            zoneLetter
          );

          let gridIntersectionXy = latLngToCanvasPoint(
            this.map,
            gridIntersectionLl
          );
          if (eastingIndex === 0) {
            ctx.beginPath();
            // If the first point lies to the west of the GZD, truncate it
            if (gridIntersectionLl.lng < GZD_WEST_BOUNDARY) {
              let nextIntersectionLl = utm.convertUtmToLatLng(
                eastArr[eastingIndex + 1],
                northingElem,
                zoneNumber,
                zoneLetter
              );
              try {
                gridIntersectionLl = connectToGzdBoundary(
                  gridIntersectionLl,
                  nextIntersectionLl,
                  "East"
                );
                gridIntersectionXy = latLngToCanvasPoint(
                  this.map,
                  gridIntersectionLl
                );
              } catch (e) {
                return;
              }
            }
            ctx.moveTo(gridIntersectionXy.x, gridIntersectionXy.y);
          } else if (eastingIndex === eastArr.length - 1) {
            if (gridIntersectionLl.lng < GZD_EAST_BOUNDARY) {
              let previousIntersectionLl = utm.convertUtmToLatLng(
                eastArr[eastingIndex - 1],
                northingElem,
                zoneNumber,
                zoneLetter
              );

              let gzdIntersectionLl = connectToGzdBoundary(
                gridIntersectionLl,
                previousIntersectionLl,
                "East"
              );

              gridIntersectionXy = latLngToCanvasPoint(
                this.map,
                gzdIntersectionLl
              );

              ctx.lineTo(gridIntersectionXy.x, gridIntersectionXy.y);

              // We need to truncate the line to stop at the GZD boundary
            } else if (gridIntersectionLl.lng > GZD_EAST_BOUNDARY) {
              let previousIntersectionLl = utm.convertUtmToLatLng(
                eastArr[eastingIndex - 1],
                northArr[northingIndex],
                zoneNumber,
                zoneLetter
              );

              let gzdIntersectionLl = connectToGzdBoundary(
                previousIntersectionLl,
                gridIntersectionLl,
                "East"
              );

              gridIntersectionXy = latLngToCanvasPoint(
                this.map,
                gzdIntersectionLl
              );

              ctx.lineTo(gridIntersectionXy.x, gridIntersectionXy.y);
            }
          } else {
            ctx.lineTo(gridIntersectionXy.x, gridIntersectionXy.y);
          }
        });
        const IS_HK_LINE = northingElem % 100000 !== 0;
        this._drawLine(ctx, IS_HK_LINE);

        try {
          let gridLabelLl = utm.convertUtmToLatLng(
            eastingArray[eastingArray.length - 1],
            northingElem,
            zoneNumber,
            zoneLetter
          );
          let gridLabelXy = latLngToCanvasPoint(this.map, {
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
