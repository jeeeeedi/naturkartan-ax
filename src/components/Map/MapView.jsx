import { useEffect } from 'react'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
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

  return (
    <MapContainer
      id="map"
      center={ALAND_CENTER}
      zoom={ALAND_ZOOM}
      style={{ height: '100%', width: '100%' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyController flyTo={flyTo} />
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
