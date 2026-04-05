import { useEffect, useMemo } from 'react'
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet'
import ParkMarker from './ParkMarker.jsx'

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
