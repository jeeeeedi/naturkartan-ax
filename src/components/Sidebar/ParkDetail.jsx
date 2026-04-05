import { useTranslation } from 'react-i18next'
import { getFacilityMeta } from '../../lib/facilities.js'

export default function ParkDetail({ park, onBack, onContribute, parkName, parkDesc, t }) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'sv'
  const name = parkName(park)
  const desc = parkDesc(park)
  const cat = park.categories

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
        {park.municipality && (
          <p className="detail-municipality">
            <span>{t('municipLabel')}:</span> {park.municipality}
          </p>
        )}
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

      <div className="detail-actions">
        <button className="btn-contribute" onClick={() => onContribute(park)}>
          {t('suggestEdit')}
        </button>
      </div>
    </div>
  )
}
