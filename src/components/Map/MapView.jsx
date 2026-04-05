import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import ParkMarker from './ParkMarker.jsx'

// Small icon for facility points using Material Symbols
function makeFacilityIcon(typ) {
  const icons = {
    'Parkering': 'local_parking',
    'Toalett':   'wc',
    'Eldplats':  'fireplace',
    'Vindskydd': 'roofing',
  }
  const symbol = icons[typ] ?? 'place'
  return L.divIcon({
    className: '',
    html: `<div style="
      background:#506E66;color:#fff;
      width:22px;height:22px;border-radius:4px;
      display:flex;align-items:center;justify-content:center;
      border:1.5px solid rgba(255,255,255,0.7);
      box-shadow:0 1px 4px rgba(0,0,0,0.25);
    "><span style="
      font-family:'Material Symbols Outlined';
      font-size:14px;line-height:1;
      font-variation-settings:'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 20;
    ">${symbol}</span></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
}

const ALAND_CENTER = [60.18, 20.0]
const ALAND_ZOOM = 9

function FlyController({ flyTo }) {
  const map = useMap()
  useEffect(() => {
    if (!flyTo?.location?.coordinates) return
    const [lng, lat] = flyTo.location.coordinates
    map.flyTo([lat, lng], 13, { duration: 1 })
  }, [flyTo, map])
  return null
}

export default function MapView({ parks, categories, selectedPark, flyTo, onSelectPark, parkName }) {
  const categoryMap = Object.fromEntries((categories ?? []).map(c => [c.id, c]))

  const pathCollection = useMemo(() => ({
    type: 'FeatureCollection',
    features: parks
      .filter(p => p.path)
      .map(p => ({
        type: 'Feature',
        geometry: p.path,
        properties: { id: p.id, category_id: p.category_id },
      })),
  }), [parks])

  return (
    <MapContainer
      id="map"
      center={ALAND_CENTER}
      zoom={ALAND_ZOOM}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &nbsp;|&nbsp; Geodata: <a href="https://www.kartor.ax/" target="_blank" rel="noopener">Ålands landskapsregering</a> (<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>)'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyController flyTo={flyTo} />
      {pathCollection.features.length > 0 && (
        <GeoJSON
          key={pathCollection.features.map(f => f.properties.id).join(',')}
          data={pathCollection}
          style={(feature) => {
            const color = categoryMap[feature.properties.category_id]?.color ?? '#888'
            const isSelected = selectedPark?.id === feature.properties.id
            return { color, weight: isSelected ? 5 : 3, opacity: isSelected ? 1 : 0.75 }
          }}
          onEachFeature={(feature, layer) => {
            layer.on('click', () => {
              const park = parks.find(p => p.id === feature.properties.id)
              if (park) onSelectPark(park)
            })
          }}
        />
      )}
      {parks.flatMap(park =>
        (park.meta?.facility_points ?? []).map((fp, i) => (
          <Marker
            key={`${park.id}-fp-${i}`}
            position={[fp.lat, fp.lng]}
            icon={makeFacilityIcon(fp.typ)}
          >
            <Popup>{fp.typ} · {parkName(park)}</Popup>
          </Marker>
        ))
      )}
      {parks.map(park => (
        <ParkMarker
          key={park.id}
          park={park}
          category={categoryMap[park.category_id]}
          selected={selectedPark?.id === park.id}
          onClick={() => onSelectPark(park)}
          label={parkName(park)}
        />
      ))}
    </MapContainer>
  )
}
