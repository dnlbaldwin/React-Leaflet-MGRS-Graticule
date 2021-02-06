# React Leaflet MGRS Graticule

Note: This is still a WIP! See known issues [HERE](https://github.com/dnlbaldwin/React-Leaflet-MGRS-Graticule/issues)

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

## Running the tests

Run the existing unit tests with the following command:

```
npm test
```

## Usage

```js
import React from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import {
  GzdGraticule,
  HundredKGraticule,
  OneKGraticule,
} from "react-leaflet-mgrs-graticule";
import "./App.css";

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
      <TileLayer
        url="https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        attribution='&copy; <a href="https://wiki.openstreetmap.org/wiki/Esri"></a> contributors'
      />
      <OneKGraticule />
      <HundredKGraticule />
      <GzdGraticule />
    </MapContainer>
  );
}

export default App;
```

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

- Hat tip to anyone whose code was used
- Inspiration
- etc
