import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase.js'

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
    if (c.type === 'edit' && c.park_id) {
      await supabase.from('parks').update({
        name_sv: d.name,
        category_id: d.category_id,
        municipality: d.municipality,
        area: d.area,
        description_sv: d.description,
        features: d.features,
      }).eq('id', c.park_id)
    } else if (c.type === 'new') {
      // New parks need coordinates — skip if missing
      if (d.lat && d.lng) {
        await supabase.from('parks').insert({
          id: d.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
          name_sv: d.name,
          category_id: d.category_id,
          municipality: d.municipality,
          area: d.area,
          description_sv: d.description,
          features: d.features,
          location: `SRID=4326;POINT(${d.lng} ${d.lat})`,
        })
      }
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
            {c.park_id && <span> → {c.park_id}</span>}
            <span className="contribution-date">{new Date(c.created_at).toLocaleDateString()}</span>
            {c.submitter_name && <span> · {c.submitter_name}</span>}
          </div>
          <pre className="contribution-data">{JSON.stringify(c.data, null, 2)}</pre>
          {c.note && <p className="contribution-note">"{c.note}"</p>}
          {c.photo_url && (
            <img src={c.photo_url} alt="Contribution photo" className="contribution-photo" />
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
