export default function ParkList({ parks, loading, onSelect, onContribute, parkName, t }) {
  if (loading) return <div className="poi-loading">…</div>

  if (parks.length === 0) {
    return <p className="poi-no-results">{t('noResults')}</p>
  }

  return (
    <ul id="poi-list" role="list" aria-label="Parks list">
      {parks.map(park => (
        <li key={park.id} className="poi-item" role="listitem">
          <button className="poi-item-btn" onClick={() => onSelect(park)}>
            <span
              className="poi-dot"
              style={{ background: park.categories?.color ?? '#888' }}
            />
            <span className="poi-item-name">{parkName(park)}</span>
            {park.municipality && (
              <span className="poi-item-meta">{park.municipality}</span>
            )}
          </button>
        </li>
      ))}
      <li className="poi-add-item">
        <button className="poi-add-btn" onClick={() => onContribute(null)}>
          {t('addMissingPlace')}
        </button>
      </li>
    </ul>
  )
}
