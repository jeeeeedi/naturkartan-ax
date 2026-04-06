import { Marker, Tooltip } from 'react-leaflet'
import { makeMarkerIcon } from '../../lib/iconUtils.js'
import { DEFAULT_CATEGORY_COLOR } from '../../lib/constants.js'

export default function ParkMarker({ park, category, selected, onClick, title }) {
  // PostgREST returns geography as WKB hex — use coordinates stored in meta instead
  const lat = park.meta?.lat
  const lng = park.meta?.lng
  if (!lat || !lng) return null
  const color = category?.color ?? DEFAULT_CATEGORY_COLOR

  return (
    <Marker
      position={[lat, lng]}
      icon={makeMarkerIcon(color, selected)}
      eventHandlers={{ click: onClick }}
      zIndexOffset={selected ? 1000 : 0}
      title={title}
    >
      <Tooltip direction="top" offset={[0, -10]}>{title}</Tooltip>
    </Marker>
  )
}
