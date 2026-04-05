import { Marker, Tooltip } from 'react-leaflet'
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

export default function ParkMarker({ park, category, selected, onClick, title }) {
  // PostgREST returns geography as WKB hex — use coordinates stored in meta instead
  const lat = park.meta?.lat
  const lng = park.meta?.lng
  if (!lat || !lng) return null
  const color = category?.color ?? '#888'

  return (
    <Marker
      position={[lat, lng]}
      icon={makeIcon(color, selected)}
      eventHandlers={{ click: onClick }}
      zIndexOffset={selected ? 1000 : 0}
      title={title}
    >
      <Tooltip direction="top" offset={[0, -10]}>{title}</Tooltip>
    </Marker>
  )
}
