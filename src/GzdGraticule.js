import { Layer } from "leaflet";
import { useMap } from "react-leaflet";
import { forward } from "mgrs";
import { drawLabel } from "./CommonUtils";

const MGRS_REGEX = /([0-9]+[A-Z])([A-Z]{2})(\d+)/;
const GZD_INDEX = 1;

const GzdGraticule = (props) => {
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
    this.currLatInterval = 8;
    this.currLngInterval = 6;

    this.defaultOptions = {
      showGrid: true,
      showLabel: true,
      opacity: 10,
      weight: 3,
      color: "#888888",
      font: "14px Courier New",
      fontColor: "#FFF",
      dashArray: [6, 6],
      minZoom: 3,
    };

    this.map = props.map;
    this.canvas = props.canvas;

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

    this.drawGzd();
  }

  drawGzd() {
    if (!this.canvas || !this.map) {
      return;
    }

    if (this.map.getZoom() < this.options.minZoom) {
      return;
    }

    let ctx = this.canvas.getContext("2d");
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
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

    let pointPerLat =
      (leftTop.lat - rightBottom.lat) / (this.canvas.height * 0.2);
    let pointPerLon =
      (rightBottom.lng - leftTop.lng) / (this.canvas.width * 0.2);

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
    for (
      let i = this.currLatInterval;
      i <= leftTop.lat;
      i += this.currLatInterval
    ) {
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

    // Northern hemisphere
    // HACK - Add six to the right bottom lng to make sure the East 31V boundary is displayed at all times
    for (
      let i = this.currLngInterval;
      i <= rightBottom.lng + 6;
      i += this.currLngInterval
    ) {
      if (i >= leftTop.lng) {
        this.drawLongitudeLine(ctx, i, leftTop.lat, rightBottom.lat);
      }
    }

    // Southern hemisphere
    for (let i = 0; i >= leftTop.lng; i -= this.currLngInterval) {
      if (i <= rightBottom.lng) {
        this.drawLongitudeLine(ctx, i, leftTop.lat, rightBottom.lat);
      }
    }
  }

  drawLatitudeLine(ctx, tick, lngLeft, lngRight) {
    const LEFT_END = this.map.latLngToContainerPoint({
      lat: tick,
      lng: lngLeft,
    });

    const RIGHT_END = this.map.latLngToContainerPoint({
      lat: tick,
      lng: lngRight,
    });

    ctx.beginPath();
    ctx.moveTo(LEFT_END.x, LEFT_END.y);
    ctx.lineTo(RIGHT_END.x, RIGHT_END.y);
    ctx.stroke();
  }

  drawLongitudeLine(ctx, tick, latTop, latBottom) {
    if (latTop >= 84) {
      latTop = 84; // Ensure GZD vertical lines do not extend into the arctic
    }

    if (latBottom <= -80) {
      latBottom = -80; // Ensure GZD vertical lines do not extend into the antarctic
    }

    const CANVAS_TOP = this.map.latLngToContainerPoint({
      lat: latTop,
      lng: tick,
    });

    const CANVAS_BOTTOM = this.map.latLngToContainerPoint({
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
          ctx.moveTo(CANVAS_TOP.x, CANVAS_TOP.y);
        }

        ctx.lineTo(RIGHT_TOP_OF_GZD.x, RIGHT_TOP_OF_GZD.y);

        ctx.moveTo(LEFT_TOP_OF_GZD.x, LEFT_TOP_OF_GZD.y);

        ctx.lineTo(LEFT_TOP_OF_GZD.x, CANVAS_BOTTOM.y);
      } else if (
        //Bottom segment only
        latTop < TOP_OF_V_SERIES_GZD &&
        latBottom < BOTTOM_OF_V_SERIES_GZD
      ) {
        ctx.moveTo(LEFT_TOP_OF_GZD.x, CANVAS_TOP.y);

        ctx.lineTo(LEFT_BOTTOM_OF_GZD.x, LEFT_BOTTOM_OF_GZD.y);

        ctx.moveTo(RIGHT_BOTTOM_OF_GZD.x, RIGHT_BOTTOM_OF_GZD.y);

        ctx.lineTo(RIGHT_BOTTOM_OF_GZD.x, CANVAS_BOTTOM.y);
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
          ctx.moveTo(CANVAS_TOP.x, CANVAS_TOP.y);
        }

        ctx.lineTo(RIGHT_TOP_OF_GZD.x, RIGHT_TOP_OF_GZD.y);

        ctx.moveTo(LEFT_TOP_OF_GZD.x, LEFT_TOP_OF_GZD.y);

        ctx.lineTo(LEFT_BOTTOM_OF_GZD.x, LEFT_BOTTOM_OF_GZD.y);

        ctx.moveTo(RIGHT_TOP_OF_GZD.x, LEFT_BOTTOM_OF_GZD.y);

        ctx.lineTo(RIGHT_TOP_OF_GZD.x, CANVAS_BOTTOM.y);
      } else if (
        // Modified vertical only
        latTop <= TOP_OF_V_SERIES_GZD &&
        latBottom >= BOTTOM_OF_V_SERIES_GZD
      ) {
        ctx.moveTo(LEFT_TOP_OF_GZD.x, CANVAS_TOP.y);

        ctx.lineTo(LEFT_BOTTOM_OF_GZD.x, CANVAS_BOTTOM.y);
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

        ctx.lineTo(CANVAS_BOTTOM.x, CANVAS_BOTTOM.y);
      } else {
        // Normal use case
        ctx.moveTo(CANVAS_TOP.x, CANVAS_TOP.y);
        ctx.lineTo(CANVAS_BOTTOM.x, CANVAS_BOTTOM.y);
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
        ctx.moveTo(CANVAS_TOP.x, CANVAS_TOP.y);
      }
      ctx.lineTo(CANVAS_BOTTOM.x, CANVAS_BOTTOM.y);
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

        ctx.lineTo(CANVAS_BOTTOM.x, CANVAS_BOTTOM.y);
      } else {
        // Normal use case
        ctx.moveTo(CANVAS_TOP.x, CANVAS_TOP.y);
        ctx.lineTo(CANVAS_BOTTOM.x, CANVAS_BOTTOM.y);
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
        ctx.moveTo(CANVAS_TOP.x, CANVAS_TOP.y);
      }
      ctx.lineTo(CANVAS_BOTTOM.x, CANVAS_BOTTOM.y);
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

        ctx.lineTo(CANVAS_BOTTOM.x, CANVAS_BOTTOM.y);
      } else {
        // Normal use case
        ctx.moveTo(CANVAS_TOP.x, CANVAS_TOP.y);
        ctx.lineTo(CANVAS_BOTTOM.x, CANVAS_BOTTOM.y);
      }
    }
    // The rest of the world...
    else {
      ctx.moveTo(CANVAS_TOP.x, CANVAS_TOP.y);
      ctx.lineTo(CANVAS_BOTTOM.x, CANVAS_BOTTOM.y);
    }
    ctx.stroke();

    this.drawGzdLabels(ctx, tick);
  }

  /** This function encapsulates drawing labels for GZDs
   *
   * @param {Obj} ctx - The HTML5 canvas' context
   * @param {Int} longitude - The longitude (representing a boundary of a GZD) for which needs labels drawn for
   */
  drawGzdLabels(ctx, longitude) {
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
        gzdLabel = forward([labelLongitude, labelLatitude], 1).match(
          MGRS_REGEX
        )[GZD_INDEX];
      } catch (error) {
        return; //Invalid MGRS value returned, so no need to try to display a label
      }

      // TODO - MORE MAGIC NUMBERS!!! - Don't want to display duplicates of the following zones
      if (
        !(gzdLabel === "33X" && longitude === 6) &&
        !(gzdLabel === "35X" && longitude === 18) &&
        !(gzdLabel === "37X" && longitude === 30)
      ) {
        const LABEL_XY = this.map.latLngToContainerPoint({
          lat: labelLatitude,
          lng: labelLongitude,
        });

        drawLabel(
          ctx,
          gzdLabel,
          this.options.fontColor,
          this.options.color,
          LABEL_XY
        );
      }
    }
  }
}

export { GzdGraticule };
