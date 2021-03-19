import React from 'react';
import { LayerGroup, LayersControl, MapContainer, TileLayer } from 'react-leaflet';
import { MgrsGraticule } from 'react-leaflet-mgrs-graticule';
import './App.css';

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
        <LayersControl.BaseLayer name="OSM Topo">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
          />
        </LayersControl.BaseLayer>
        <LayersControl.Overlay checked name="MGRS graticule">
          <LayerGroup>
            <MgrsGraticule />
          </LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>
    </MapContainer>
  );
}

export default App;
