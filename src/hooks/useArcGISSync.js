import { supabase } from '../lib/supabase.js'

// Hiking trails — richest data (17 fields incl. length, image, terrain)
const NATURSTIGAR_URL = 'https://services6.arcgis.com/Y3TYniQXfKxtz8ZO/ArcGIS/rest/services/Naturstigar/FeatureServer'
// Trail waypoints — photo URLs
const WAYPOINTS_URL = 'https://services6.arcgis.com/Y3TYniQXfKxtz8ZO/ArcGIS/rest/services/vandringsstigar_waypoints/FeatureServer'
// Cycling routes — 21 named routes with distances
const CYKEL_URL = 'https://services6.arcgis.com/Y3TYniQXfKxtz8ZO/ArcGIS/rest/services/cykel_ny/FeatureServer'

const QUERY = '?where=1%3D1&outFields=*&f=geojson&outSR=4326'

async function fetchLayer(baseUrl, layerId) {
  const res = await fetch(`${baseUrl}/${layerId}/query${QUERY}`)
  if (!res.ok) throw new Error(`ArcGIS ${baseUrl} layer ${layerId} failed: ${res.status}`)
  return res.json()
}

// Compute midpoint of a LineString or MultiLineString for the map pin
function midpoint(geometry) {
  let coords = []
  if (geometry.type === 'LineString') {
    coords = geometry.coordinates
  } else if (geometry.type === 'MultiLineString') {
    // Pick the longest segment
    coords = geometry.coordinates.reduce((a, b) => b.length > a.length ? b : a, [])
  }
  if (!coords.length) return null
  const mid = coords[Math.floor(coords.length / 2)]
  return { lng: mid[0], lat: mid[1] }
}

// Normalise a trail name for fuzzy matching (strip diacritics, lowercase)
function normaliseName(name) {
  return (name ?? '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function useArcGISSync() {
  async function sync(onProgress) {
    // ── 1. Fetch parking & rest-area facilities (Service A, layer 0) ──────────
    onProgress('Hämtar faciliteter (Naturstigar lager 0)…')
    const facilitiesGeoJSON = await fetchLayer(NATURSTIGAR_URL, 0)

    // Build: normalised trail name → Set of facility types
    const featuresByTrail = {}
    for (const f of facilitiesGeoJSON.features) {
      const plats = normaliseName(f.properties.Plats)
      const typ = f.properties.Typ?.trim()
      if (!plats || !typ) continue
      if (!featuresByTrail[plats]) featuresByTrail[plats] = new Set()
      featuresByTrail[plats].add(typ)
    }

    // ── 2. Fetch trail polylines (Service A, layer 1) ─────────────────────────
    onProgress('Hämtar vandringsstigar (Naturstigar lager 1)…')
    const trailsGeoJSON = await fetchLayer(NATURSTIGAR_URL, 1)

    // ── 3. Fetch waypoints with photos (Service C, layer 0) ───────────────────
    onProgress('Hämtar waypoint-foton (vandringsstigar_waypoints)…')
    const waypointsGeoJSON = await fetchLayer(WAYPOINTS_URL, 0)

    // Build: normalised name → { pic_url, thumb_url, description }
    const waypointsByName = {}
    for (const f of waypointsGeoJSON.features) {
      const key = normaliseName(f.properties.name)
      if (!key) continue
      waypointsByName[key] = {
        pic_url:   f.properties.pic_url   || null,
        thumb_url: f.properties.thumb_url || null,
        description: f.properties.description || '',
      }
    }

    // ── 4. Map trails → park records ──────────────────────────────────────────
    onProgress(`Bearbetar ${trailsGeoJSON.features.length} stigar…`)

    const parks = []
    for (const f of trailsGeoJSON.features) {
      const pt = midpoint(f.geometry)
      if (!pt) continue

      const objectId  = f.properties.OBJECTID
      const namn      = f.properties.Namn?.trim() || `Stig ${objectId}`
      const normNamn  = normaliseName(namn)
      const facilities = [...(featuresByTrail[normNamn] ?? [])]
      const waypoint  = waypointsByName[normNamn] ?? {}

      // Length field (e.g. "2.5-5 km") maps to our `area` text column
      const langd = f.properties.langd?.trim() || null

      // Use waypoint description as fallback if slogan is empty
      const descSv = f.properties.sloganSwe?.trim() || waypoint.description || ''
      const descEn = f.properties.sloganEn?.trim() || ''
      const descFi = f.properties.sloganFi?.trim() || ''

      parks.push({
        id:            `arcgis-l1-${objectId}`,
        name_sv:       namn,
        category_id:   'recreation',
        location:      `POINT(${pt.lng} ${pt.lat})`,
        area:          langd,
        description_sv: descSv,
        description_en: descEn,
        description_fi: descFi,
        features:      facilities,
        // Store photo URLs in a JSON metadata column (added below)
        source_id:     `arcgis-l1-${objectId}`,
        source_url:    NATURSTIGAR_URL,
        synced_at:     new Date().toISOString(),
        // Extra ArcGIS fields stored for reference
        meta: {
          bild:    f.properties.bild    || null,
          terrang: f.properties.Terrang || null,
          typ:     f.properties.TYP     || null,
          pic_url:   waypoint.pic_url   || null,
          thumb_url: waypoint.thumb_url || null,
        },
      })
    }

    // ── 5. Fetch cycling routes (cykel_ny, layer 0) ──────────────────────────
    onProgress('Hämtar cykelleder (cykel_ny)…')
    const cykelGeoJSON = await fetchLayer(CYKEL_URL, 0)

    for (const f of cykelGeoJSON.features) {
      const pt = midpoint(f.geometry)
      if (!pt) continue

      const objectId = f.properties.FID ?? f.properties.OBJECTID
      // Plats is e.g. "Eckerö - Käringsund 7 km" — name and distance combined
      const plats = f.properties.Plats?.trim() || `Cykelrutt ${objectId}`
      const km = f.properties.Km ? `${f.properties.Km} km` : null

      parks.push({
        id:            `arcgis-cykel-${objectId}`,
        name_sv:       plats,
        category_id:   'cycling',
        location:      `POINT(${pt.lng} ${pt.lat})`,
        area:          km,
        description_sv: '',
        description_en: '',
        description_fi: '',
        features:      [],
        source_id:     `arcgis-cykel-${objectId}`,
        source_url:    CYKEL_URL,
        synced_at:     new Date().toISOString(),
        meta:          { rutt: f.properties.Rutt ?? null },
      })
    }

    // ── 6. Upsert everything to Supabase ──────────────────────────────────────
    onProgress(`Skriver ${parks.length} poster till databasen…`)

    const { error } = await supabase
      .from('parks')
      .upsert(parks, { onConflict: 'source_id' })

    if (error) throw error

    return parks.length
  }

  return { sync }
}
