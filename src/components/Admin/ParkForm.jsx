import { useState } from 'react'

export default function ParkForm({ park, categories, onSave, onCancel, t }) {
  const [form, setForm] = useState({
    id: park?.id ?? '',
    name_sv: park?.name_sv ?? '',
    name_en: park?.name_en ?? '',
    name_fi: park?.name_fi ?? '',
    category_id: park?.category_id ?? categories[0]?.id ?? '',
    municipality: park?.municipality ?? '',
    area: park?.area ?? '',
    description_sv: park?.description_sv ?? '',
    description_en: park?.description_en ?? '',
    description_fi: park?.description_fi ?? '',
    features: park?.features?.join(', ') ?? '',
    lat: park?.location?.coordinates?.[1] ?? '',
    lng: park?.location?.coordinates?.[0] ?? '',
  })
  const [saving, setSaving] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      id: form.id,
      name_sv: form.name_sv,
      name_en: form.name_en || null,
      name_fi: form.name_fi || null,
      category_id: form.category_id,
      municipality: form.municipality || null,
      area: form.area || null,
      description_sv: form.description_sv || '',
      description_en: form.description_en || '',
      description_fi: form.description_fi || '',
      features: form.features.split(',').map(f => f.trim()).filter(Boolean),
      location: { type: 'Point', coordinates: [parseFloat(form.lng), parseFloat(form.lat)] },
    }
    await onSave(payload)
    setSaving(false)
  }

  return (
    <form className="park-form" onSubmit={handleSubmit}>
      <h2>{park ? t('adminEditPark') : t('adminAddPark')}</h2>

      {!park && (
        <label>
          ID (slug, e.g. ramsholmen)
          <input value={form.id} onChange={set('id')} required pattern="[a-z0-9\-]+" />
        </label>
      )}

      <div className="form-row">
        <label>Namn (SV) *<input value={form.name_sv} onChange={set('name_sv')} required /></label>
        <label>Name (EN)<input value={form.name_en} onChange={set('name_en')} /></label>
        <label>Nimi (FI)<input value={form.name_fi} onChange={set('name_fi')} /></label>
      </div>

      <div className="form-row">
        <label>
          {t('cfCategory')}
          <select value={form.category_id} onChange={set('category_id')}>
            {categories.map(c => <option key={c.id} value={c.id}>{c.label_sv}</option>)}
          </select>
        </label>
        <label>{t('cfMunicipality')}<input value={form.municipality} onChange={set('municipality')} /></label>
        <label>{t('cfArea')}<input value={form.area} onChange={set('area')} /></label>
      </div>

      <div className="form-row">
        <label>Lat *<input type="number" step="any" value={form.lat} onChange={set('lat')} required /></label>
        <label>Lng *<input type="number" step="any" value={form.lng} onChange={set('lng')} required /></label>
      </div>

      <label>Beskrivning (SV)<textarea value={form.description_sv} onChange={set('description_sv')} rows={3} /></label>
      <label>Description (EN)<textarea value={form.description_en} onChange={set('description_en')} rows={3} /></label>
      <label>Kuvaus (FI)<textarea value={form.description_fi} onChange={set('description_fi')} rows={3} /></label>

      <label>{t('cfFeatures')}<input value={form.features} onChange={set('features')} /></label>

      <div className="form-actions">
        <button type="submit" className="btn-primary" disabled={saving}>{t('adminSave')}</button>
        <button type="button" className="btn-secondary" onClick={onCancel}>{t('adminCancel')}</button>
      </div>
    </form>
  )
}
