import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import { supabase } from '../../lib/supabase.js'
import { getFacilityMeta } from '../../lib/facilities.js'

function pathBounds(path) {
  const lats = path.coordinates.map(c => c[1])
  const lngs = path.coordinates.map(c => c[0])
  return [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]]
}

function makeFacilityIcon(typ) {
  const { icon, color } = getFacilityMeta(typ)
  return L.divIcon({
    className: 'facility-marker-icon-wrap',
    html: `<div style="background:${color};color:#fff;width:24px;height:24px;border-radius:8px;display:flex;align-items:center;justify-content:center;border:1.5px solid rgba(255,255,255,0.85);box-shadow:0 2px 8px rgba(0,0,0,0.3)"><span style="font-family:'Material Symbols Outlined';font-size:15px;line-height:1;font-variation-settings:'FILL' 0,'wght' 300,'GRAD' 0,'opsz' 20">${icon}</span></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  })
}

function TrailPreviewMap({ path, facilityPoints }) {
  return (
    <MapContainer
      key="preview"
      bounds={pathBounds(path)}
      style={{ height: '220px', marginTop: '0.75rem', borderRadius: '6px' }}
      scrollWheelZoom={false}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <GeoJSON data={path} style={{ color: '#3a7d44', weight: 3 }} />
      {(facilityPoints ?? []).map((fp, i) => (
        <Marker key={i} position={[fp.lat, fp.lng]} icon={makeFacilityIcon(fp.typ)}>
          <Tooltip direction="top" offset={[0, -10]}>{fp.typ}</Tooltip>
        </Marker>
      ))}
    </MapContainer>
  )
}

export default function ContributionReview({ onApplied, t }) {
  const [contributions, setContributions] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    const { data } = await supabase
      .from('contributions')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
    setContributions(data ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleApprove(c) {
    const d = c.data
    if (c.type === 'edit' && c.item_id) {
      const { data: item } = await supabase
        .from('items')
        .select('id, source_id')
        .eq('id', c.item_id)
        .single()

      if (item?.source_id) {
        await supabase
          .from('item_community_edits')
          .insert({
            item_id: c.item_id,
            contribution_id: c.id,
            submitter_name: c.submitter_name ?? null,
            note: c.note ?? null,
            photo_url: c.photo_url ?? null,
            data: d,
            created_at: c.created_at,
            approved_at: new Date().toISOString(),
          })
      } else {
        await supabase.from('items').update({
          name_sv: d.name,
          category_id: d.category_id,
          area: d.area,
          description_sv: d.description,
          features: d.features,
        }).eq('id', c.item_id)
      }
    } else if (c.type === 'new' && d.path) {
      // Trail contribution — derive marker location from path midpoint
      const coords = d.path.coordinates
      const mid = coords[Math.floor(coords.length / 2)]
      const [lng, lat] = mid

      const meta = {}
      if ((d.facility_points ?? []).length > 0) {
        meta.facility_points = d.facility_points
      }

      await supabase.from('items').insert({
        id: d.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
        name_sv: d.name,
        category_id: d.category_id,
        area: d.area || null,
        description_sv: d.description || '',
        features: (d.facility_points ?? []).map(fp => fp.typ),
        location: `SRID=4326;POINT(${lng} ${lat})`,
        path: d.path,
        meta,
      })
    }

    await supabase.from('contributions').update({ status: 'approved' }).eq('id', c.id)
    onApplied()
    load()
  }

  async function handleReject(c) {
    await supabase.from('contributions').update({ status: 'rejected' }).eq('id', c.id)
    load()
  }

  if (loading) return <p>…</p>
  if (contributions.length === 0) return <p>{t('noContributions')}</p>

  return (
    <div className="contributions-list">
      <h2>{t('pendingContributions')} ({contributions.length})</h2>
      {contributions.map(c => (
        <div key={c.id} className="contribution-card">
          <div className="contribution-meta">
            <span className="contribution-type">{c.type}</span>
            {c.item_id && <span> → {c.item_id}</span>}
            <span className="contribution-date">{new Date(c.created_at).toLocaleDateString()}</span>
            {c.submitter_name && <span> · {c.submitter_name}</span>}
          </div>
          <pre className="contribution-data">{JSON.stringify({ ...c.data, path: c.data.path ? `[LineString, ${c.data.path.coordinates?.length} pts]` : undefined }, null, 2)}</pre>
          {c.note && <p className="contribution-note">"{c.note}"</p>}
          {c.data.path && (
            <TrailPreviewMap path={c.data.path} facilityPoints={c.data.facility_points} />
          )}
          <div className="form-actions">
            <button className="btn-primary" onClick={() => handleApprove(c)}>{t('approve')}</button>
            <button className="btn-secondary" onClick={() => handleReject(c)}>{t('reject')}</button>
          </div>
        </div>
      ))}
    </div>
  )
}
