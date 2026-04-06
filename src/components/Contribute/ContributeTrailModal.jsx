import { useState } from 'react'
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet'
import { supabase } from '../../lib/supabase.js'

const FACILITY_TYPES = [
  'Parkering', 'Toalett', 'Eldplats', 'Rastplats',
  'Badplats', 'Hamn', 'Utsiktstorn', 'Infoskylt', 'Fotoplats',
]

function parseGpx(text) {
  const doc = new DOMParser().parseFromString(text, 'application/xml')
  const trkpts = Array.from(doc.querySelectorAll('trkpt'))
  if (trkpts.length < 2) return null
  const coordinates = trkpts.map(pt => [
    parseFloat(pt.getAttribute('lon')),
    parseFloat(pt.getAttribute('lat')),
  ])
  return { type: 'LineString', coordinates }
}

function pathBounds(path) {
  const lats = path.coordinates.map(c => c[1])
  const lngs = path.coordinates.map(c => c[0])
  return [[Math.min(...lats), Math.min(...lngs)], [Math.max(...lats), Math.max(...lngs)]]
}

export default function ContributeTrailModal({ categories, onClose, onSubmitted, t }) {
  const [form, setForm] = useState({
    name: '',
    category_id: categories[0]?.id ?? '',
    area: '',
    description: '',
  })
  const [authorName, setAuthorName] = useState('')
  const [note, setNote] = useState('')
  const [path, setPath] = useState(null)
  const [gpxError, setGpxError] = useState('')
  const [facilityPoints, setFacilityPoints] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  function handleGpxChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const parsed = parseGpx(ev.target.result)
      if (!parsed) {
        setGpxError(t('cfGpxError'))
        setPath(null)
      } else {
        setGpxError('')
        setPath(parsed)
      }
    }
    reader.readAsText(file)
  }

  function toggleFacility(typ) {
    setFacilityPoints(pts => {
      if (pts.find(p => p.typ === typ)) return pts.filter(p => p.typ !== typ)
      return [...pts, { typ, coords: '' }]
    })
  }

  function setFacilityCoords(typ, coords) {
    setFacilityPoints(pts => pts.map(p => p.typ === typ ? { ...p, coords } : p))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError(t('cfErrorName')); return }
    if (!path) { setError(t('cfErrorGpx')); return }
    setError('')
    setSubmitting(true)

    const parsedFacilityPoints = facilityPoints
      .filter(p => p.coords.trim())
      .map(p => {
        const [lat, lng] = p.coords.split(',').map(s => parseFloat(s.trim()))
        return { typ: p.typ, lat, lng }
      })
      .filter(p => !isNaN(p.lat) && !isNaN(p.lng))

    const { error: insertError } = await supabase.from('contributions').insert({
      item_id: null,
      type: 'new',
      data: {
        name: form.name,
        category_id: form.category_id,
        area: form.area,
        description: form.description,
        path,
        facility_points: parsedFacilityPoints,
      },
      submitter_name: authorName || null,
      note: note || null,
      photo_url: null,
    })

    setSubmitting(false)
    if (insertError) { setError(insertError.message); return }
    setSubmitted(true)
    onSubmitted()
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-box">
        <button className="modal-close" onClick={onClose} aria-label={t('cfClose')}>×</button>
        <h2>{t('cfAddTrail')}</h2>

        {submitted ? (
          <div className="contribute-success">
            <p>{t('cfSuccessMsg')}</p>
            <button className="btn-primary" onClick={onClose}>{t('cfClose')}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <label>
              {t('cfName')} *
              <input value={form.name} onChange={set('name')} required />
            </label>
            <label>
              {t('cfCategory')}
              <select value={form.category_id} onChange={set('category_id')}>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.label_sv}</option>
                ))}
              </select>
            </label>
            <label>
              {t('cfArea')}
              <input value={form.area} onChange={set('area')} placeholder="t.ex. 3–5 km" />
            </label>
            <label>
              {t('cfDescription')}
              <textarea value={form.description} onChange={set('description')} rows={3} />
            </label>

            <fieldset className="contribute-fieldset">
              <legend>{t('cfGpxUpload')} *</legend>
              <small className="file-note">{t('cfGpxHint')}</small>
              <input type="file" accept=".gpx" onChange={handleGpxChange} />
              {gpxError && <p className="form-error">{gpxError}</p>}
              {path && (
                <>
                  <p className="gpx-parsed">{t('cfGpxParsed', { count: path.coordinates.length })}</p>
                  <MapContainer
                    key="gpx-preview"
                    bounds={pathBounds(path)}
                    style={{ height: '180px', marginTop: '0.5rem', borderRadius: '6px' }}
                    scrollWheelZoom={false}
                    zoomControl={false}
                    attributionControl={false}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <GeoJSON data={path} style={{ color: '#3a7d44', weight: 3 }} />
                  </MapContainer>
                </>
              )}
            </fieldset>

            <fieldset className="contribute-fieldset">
              <legend>{t('cfFacilityPoints')}</legend>
              <div className="facility-checkboxes">
                {FACILITY_TYPES.map(typ => (
                  <label key={typ} className="facility-check">
                    <input
                      type="checkbox"
                      checked={!!facilityPoints.find(p => p.typ === typ)}
                      onChange={() => toggleFacility(typ)}
                    />
                    {typ}
                  </label>
                ))}
              </div>
              {facilityPoints.map(({ typ, coords }) => (
                <label key={typ} className="facility-coords-label">
                  {typ} — {t('cfFacilityCoords')}
                  <input
                    value={coords}
                    onChange={e => setFacilityCoords(typ, e.target.value)}
                    placeholder="60.098086, 19.925501"
                  />
                </label>
              ))}
            </fieldset>

            <label>
              {t('cfAuthorName')}
              <input value={authorName} onChange={e => setAuthorName(e.target.value)} />
            </label>
            <label>
              {t('cfNote')}
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} />
            </label>

            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={submitting}>
                {submitting ? t('cfUploading') : t('cfSubmit')}
              </button>
              <button type="button" className="btn-secondary" onClick={onClose}>
                {t('cfClose')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
