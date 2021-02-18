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

    this.drawGrid();
  }
}

export { OneKGraticule };
