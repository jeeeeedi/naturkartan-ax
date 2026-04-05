import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'

export default function ContributeModal({ park, categories, onClose, onSubmitted, parkName, t }) {
  const isNew = !park
  const [form, setForm] = useState({
    name: park ? parkName(park) : '',
    category_id: park?.category_id ?? categories[0]?.id ?? '',
    municipality: park?.municipality ?? '',
    area: park?.area ?? '',
    description: '',
    features: park?.features?.join(', ') ?? '',
  })
  const [authorName, setAuthorName] = useState('')
  const [note, setNote] = useState('')
  const [photo, setPhoto] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError(t('cfErrorName')); return }
    setError('')
    setUploading(true)

    let photoUrl = null
    if (photo) {
      const ext = photo.name.split('.').pop()
      const path = `contributions/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('park-photos')
        .upload(path, photo, { contentType: photo.type })
      if (!uploadError) {
        const { data } = supabase.storage.from('park-photos').getPublicUrl(path)
        photoUrl = data.publicUrl
      }
    }

    const { error: insertError } = await supabase.from('contributions').insert({
      park_id: park?.id ?? null,
      type: isNew ? 'new' : 'edit',
      data: {
        name: form.name,
        category_id: form.category_id,
        municipality: form.municipality,
        area: form.area,
        description: form.description,
        features: form.features.split(',').map(f => f.trim()).filter(Boolean),
      },
      submitter_name: authorName || null,
      note: note || null,
      photo_url: photoUrl,
    })

    setUploading(false)
    if (insertError) { setError(insertError.message); return }
    setSubmitted(true)
    onSubmitted()
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-box">
        <button className="modal-close" onClick={onClose} aria-label={t('cfClose')}>×</button>
        <h2>{isNew ? t('contributeTitleNew') : t('contributeTitle')}</h2>

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
              {t('cfMunicipality')}
              <input value={form.municipality} onChange={set('municipality')} />
            </label>
            <label>
              {t('cfArea')}
              <input value={form.area} onChange={set('area')} />
            </label>
            <label>
              {t('cfDescription')}
              <textarea value={form.description} onChange={set('description')} rows={3} />
            </label>
            <label>
              {t('cfFeatures')}
              <input value={form.features} onChange={set('features')} />
            </label>
            <label>
              {t('cfAuthorName')}
              <input value={authorName} onChange={e => setAuthorName(e.target.value)} />
            </label>
            <label>
              {t('cfNote')}
              <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} />
            </label>
            <label>
              {t('cfPhoto')}
              <span className="file-note">{t('cfPhotoNote')}</span>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={e => setPhoto(e.target.files[0] ?? null)}
              />
            </label>
            {error && <p className="form-error">{error}</p>}
            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={uploading}>
                {uploading ? t('cfUploading') : t('cfSubmit')}
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
