import { useEffect, useMemo, useState, useRef } from 'react'
import { MapContainer, TileLayer, GeoJSON, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import ParkMarker from './ParkMarker.jsx'

const userDotIcon = L.divIcon({
  className: '',
  html: '<div class="user-location-dot"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
})

function UserLocation() {
  const map = useMap()
  const [pos, setPos] = useState(null)
  const [status, setStatus] = useState('idle') // idle | active | error
  const watchId = useRef(null)

  function start() {
    if (!navigator.geolocation) { setStatus('error'); return }
    setStatus('active')
    watchId.current = navigator.geolocation.watchPosition(
      (p) => {
        const latlng = [p.coords.latitude, p.coords.longitude]
        setPos(latlng)
        map.flyTo(latlng, Math.max(map.getZoom(), 13), { duration: 1 })
      },
      () => setStatus('error'),
      { enableHighAccuracy: true }
    )
  }

  function stop() {
    if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current)
    watchId.current = null
    setStatus('idle')
    setPos(null)
  }

  function toggle() { status === 'active' ? stop() : start() }

  useEffect(() => () => { if (watchId.current != null) navigator.geolocation.clearWatch(watchId.current) }, [])

  return (
    <>
      {pos && <Marker position={pos} icon={userDotIcon} zIndexOffset={2000} />}
      <div
        id="locate-btn"
        className={status !== 'idle' ? status : ''}
        onClick={toggle}
        title="Show my location"
      >
        <span className="icon">{status === 'active' ? 'my_location' : 'location_searching'}</span>
      </div>
    </>
  )
}

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
    const lat = flyTo?.meta?.lat
    const lng = flyTo?.meta?.lng
    if (!lat || !lng) return
    map.flyTo([lat, lng], 13, { duration: 1 })
  }, [flyTo, map])
  return null
}

export default function MapView({ parks, categories, selectedPark, flyTo, onSelectPark, parkName }) {
  const categoryMap = Object.fromEntries((categories ?? []).map(c => [c.id, c]))

  const pathCollection = useMemo(() => {
    const source = selectedPark ? parks.filter(p => p.id === selectedPark.id) : parks
    return {
      type: 'FeatureCollection',
      features: source
        .filter(p => p.path)
        .map(p => ({
          type: 'Feature',
          geometry: p.path,
          properties: { id: p.id, category_id: p.category_id },
        })),
    }
  }, [parks, selectedPark])

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
      <UserLocation />
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
      {selectedPark && (selectedPark.meta?.facility_points ?? []).map((fp, i) => (
        <Marker
          key={`${selectedPark.id}-fp-${i}`}
          position={[fp.lat, fp.lng]}
          icon={makeFacilityIcon(fp.typ)}
        >
          <Popup>{fp.typ} · {parkName(selectedPark)}</Popup>
        </Marker>
      ))}
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
