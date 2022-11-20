import './App.css';
import { TileLayer, MapContainer, LayerGroup, LayersControl } from 'react-leaflet';
import { MgrsGraticule } from 'react-leaflet-mgrs-graticule';
import React from 'react';

// Assigning the same name to the overlay as it's named in the control box
// makes it much easier to toggle it on and off when multiple overlays
// are employed.
const mgrsGraticuleName = 'MGRS';
// Controls whether the overlay is displayed on map load
const overlayEnabled = true;

const graticuleOptions = {
  font: '18px Courier New',
  gridFont: '18px Courier New',
};
function App() {
  return (
    <MapContainer
      center={[45.4, -75.7]}
      zoom={7}
      minZoom={3}
      maxZoom={18}
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
            <MgrsGraticule name={mgrsGraticuleName} checked={overlayEnabled} options={graticuleOptions} />
          </LayerGroup>
        </LayersControl.Overlay>
      </LayersControl>
    </MapContainer>
  );
}

export default App;
