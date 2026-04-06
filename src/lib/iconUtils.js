import L from 'leaflet'
import { getFacilityMeta } from './facilities.js'

export function makeFacilityIcon(typ) {
  const { icon, color } = getFacilityMeta(typ)
  return L.divIcon({
    className: 'facility-marker-icon-wrap',
    html: `<div style="background:${color};color:#fff;width:24px;height:24px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:1.5px solid rgba(255,255,255,0.85);box-shadow:0 2px 8px rgba(0,0,0,0.3)"><span style="font-family:'Material Symbols Outlined';font-size:15px;line-height:1;font-variation-settings:'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 20">${icon}</span></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

export function makeMarkerIcon(color, selected) {
  const size = selected ? 14 : 10
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;background:${color};border-radius:50%;border:${selected ? '2px solid #fff' : '1.5px solid rgba(255,255,255,0.6)'};box-shadow:${selected ? '0 0 0 3px rgba(255,255,255,0.35)' : 'none'};cursor:pointer;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}
