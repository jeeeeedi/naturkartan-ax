import { Marker, Popup } from 'react-leaflet'
import L from 'leaflet'

function makeIcon(color, selected) {
  const size = selected ? 14 : 10
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:50%;
      border:${selected ? '2px solid #fff' : '1.5px solid rgba(255,255,255,0.6)'};
      box-shadow:${selected ? '0 0 0 3px rgba(255,255,255,0.35)' : 'none'};
      cursor:pointer;
    "></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export default function ParkMarker({ park, category, selected, onClick, label }) {
  if (!park.location?.coordinates) return null
  const [lng, lat] = park.location.coordinates
  const color = category?.color ?? '#888'

  return (
    <Marker
      position={[lat, lng]}
      icon={makeIcon(color, selected)}
      eventHandlers={{ click: onClick }}
      zIndexOffset={selected ? 1000 : 0}
    >
      <Popup>{label}</Popup>
    </Marker>
  )
}
