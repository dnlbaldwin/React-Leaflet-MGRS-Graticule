# React Leaflet MGRS Graticule

**Note: This is still a WIP!**

See known issues [HERE](https://github.com/dnlbaldwin/React-Leaflet-MGRS-Graticule/issues)

See the live demo [HERE](https://dnlbaldwin.github.io/React-Leaflet-MGRS-Graticule/)

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites

This library uses React-Leaflet-V3. It is not tested with React-Leaflet-V2.

### Installing

To install all dependencies run the following command:

```
npm install
```

To run the example on your desktop, navigate to the example directory and run:

```
npm start
```

## Running the tests

Run the existing unit tests with the following command:

```
npm test
```

## Usage

```js
import React from 'react';
import { LayerGroup, LayersControl, MapContainer, TileLayer } from 'react-leaflet';
import { MgrsGraticule } from 'react-leaflet-mgrs-graticule';
import './App.css';

// Assigning the same name to the overlay as it's named in the control box
// makes it much easier to toggle it on and off when multiple overlays
// are employed.
const mgrsGraticuleName = 'MGRS';
// Controls whether the overlay is displayed on map load
const overlayEnabled = true;
function App() {
  return (
    <MapContainer
      center={[45.4, -75.7]}
      zoom={7}
      minZoom={3}
      maxZoom={16}
      maxNativeZoom={15}
      maxBounds={[
        [-90, -180],
        [90, 180],
      ]}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="ESRI Satellite">
          <TileLayer
            url="https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://wiki.openstreetmap.org/wiki/Esri"></a> contributors'
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="ESRI Clarity">
          <TileLayer
            url="https://clarity.maptiles.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://wiki.openstreetmap.org/wiki/Esri"></a> contributors'
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="OSM">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer name="OSM Topo">
          <TileLayer url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png" attribution="OSM" />
        </LayersControl.BaseLayer>
        <LayersControl.Overlay checked={overlayEnabled} name={mgrsGraticuleName}>
          <LayerGroup>
            <MgrsGraticule name={mgrsGraticuleName} checked={overlayEnabled} />
          </LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>
    </MapContainer>
  );
}

export default App;
```

## Roadmap v0.3.0

- Set graticule properties through props
- Investigate adding HK labels when grids are displayed

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE) file for details
