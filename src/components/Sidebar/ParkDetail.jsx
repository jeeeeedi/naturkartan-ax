import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getFacilityMeta } from '../../lib/facilities.js'
import { supabase } from '../../lib/supabase.js'

export default function ParkDetail({ park, onBack, onContribute, parkName, parkDesc, t }) {
  const { i18n } = useTranslation()
  const [communityEdits, setCommunityEdits] = useState([])
  const lang = i18n.language || 'sv'
  const name = parkName(park)
  const desc = parkDesc(park)
  const cat = park.categories

  useEffect(() => {
    let cancelled = false

    async function loadCommunityEdits() {
      const { data } = await supabase
        .from('item_community_edits')
        .select('*')
        .eq('item_id', park.id)
        .order('approved_at', { ascending: false })
        .limit(5)

      if (!cancelled) setCommunityEdits(data ?? [])
    }

    loadCommunityEdits()
    return () => { cancelled = true }
  }, [park.id])

  return (
    <div id="park-detail" aria-label="Route details" role="region">
      <button className="detail-back-btn" onClick={onBack} aria-label="Back to list">
        ← {t('adminItems')}
      </button>

      <div className="detail-header">
        {cat && (
          <span className="detail-category-badge" style={{ background: cat.color }}>
            {cat[`label_${lang}`] || cat.label_sv}
          </span>
        )}
        <h2 className="detail-name">{name}</h2>
        {park.area && (
          <p className="detail-area">
            <span>{t('areaLabel')}:</span> {park.area}
          </p>
        )}
      </div>

      {desc && <p className="detail-description">{desc}</p>}

      {park.features?.length > 0 && (
        <div className="detail-features">
          <h3>{t('featuresTitle')}</h3>
          <ul className="feature-list">
            {park.features.map(f => (
              <li key={f} className="feature-tag">
                <span className="icon feature-tag-icon" aria-hidden="true">{getFacilityMeta(f, lang).icon}</span>
                <span>{getFacilityMeta(f, lang).label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {communityEdits.length > 0 && (
        <div className="detail-community-updates">
          <h3>{t('communityUpdatesTitle')}</h3>
          <ul className="community-updates-list">
            {communityEdits.map((edit) => {
              const d = edit.data ?? {}
              const date = new Date(edit.approved_at || edit.created_at)

              return (
                <li key={edit.id} className="community-update-item">
                  <p className="community-update-meta">
                    {t('communityUpdateBy')}: {edit.submitter_name || t('communityAnonymous')}
                    {' · '}
                    {date.toLocaleDateString(lang)}
                  </p>
                  {d.description && <p className="community-update-text">{d.description}</p>}
                  {edit.note && <p className="community-update-note">{edit.note}</p>}
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="detail-actions">
        <button className="btn-contribute" onClick={() => onContribute(park)}>
          {t('suggestEdit')}
        </button>
      </div>
    </div>
  )
}
