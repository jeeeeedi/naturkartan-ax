import ParkList from './ParkList.jsx'
import ParkDetail from './ParkDetail.jsx'

export default function Sidebar({
  open, parks, allParks, categories, loading, selectedPark,
  filterCategory, search, onSelectPark, onClearPark, onFilterCategory,
  onSearch, onContribute, parkName, parkDesc, t,
}) {
  const totalParks = allParks.length

  return (
    <aside id="sidebar" className={open ? '' : 'sidebar--hidden'} aria-label="Park information">

      {!selectedPark && (
        <>
          <section id="park-info">
            <h2>{t('aboutTitle')}</h2>
            <p id="about-text">{t('aboutText')}</p>
            <ul id="park-stats">
              <li><span className="stat-icon">🌊</span><span><strong>6 700+</strong> {t('unitIslands')}</span></li>
              <li><span className="stat-icon">🌲</span><span><strong>{totalParks}</strong> {t('unitParks')}</span></li>
              <li><span className="stat-icon">🏘</span><span><strong>16</strong> {t('unitMunicip')}</span></li>
              <li><span className="stat-icon">☕</span><span>{t('statOpenLabel')} <strong>{t('unitOpen')}</strong></span></li>
            </ul>
          </section>

          <section id="trail-legend">
            <h2>{t('parkTypesTitle')}</h2>
            {(categories ?? []).map(cat => (
              <div key={cat.id} className="legend-item">
                <span className="legend-swatch" style={{ background: cat.color }} />
                <div>
                  <strong>{cat[`label_${t('lang') || 'sv'}`] || cat.label_sv}</strong>
                  <span>{cat[`desc_${t('lang') || 'sv'}`] || cat.desc_sv}</span>
                </div>
              </div>
            ))}
          </section>

          <section id="poi-section">
            <h2>{t('parksTitle')}</h2>
            <div id="category-filters" role="group" aria-label="Filter by type">
              <button
                className={`cat-filter-btn${!filterCategory ? ' active' : ''}`}
                onClick={() => onFilterCategory(null)}
              >
                Alla
              </button>
              {(categories ?? []).map(cat => (
                <button
                  key={cat.id}
                  className={`cat-filter-btn${filterCategory === cat.id ? ' active' : ''}`}
                  style={filterCategory === cat.id ? { background: cat.color, borderColor: cat.color } : {}}
                  onClick={() => onFilterCategory(filterCategory === cat.id ? null : cat.id)}
                >
                  {cat.label_sv}
                </button>
              ))}
            </div>
            <div id="poi-search-wrap">
              <span id="poi-search-icon">🔍</span>
              <input
                type="text"
                id="poi-search"
                value={search}
                placeholder={t('searchPlaceholder')}
                aria-label={t('searchPlaceholder')}
                onChange={e => onSearch(e.target.value)}
              />
            </div>
          </section>
        </>
      )}

      {selectedPark ? (
        <ParkDetail
          park={selectedPark}
          onBack={onClearPark}
          onContribute={onContribute}
          parkName={parkName}
          parkDesc={parkDesc}
          t={t}
        />
      ) : (
        <ParkList
          parks={parks}
          loading={loading}
          onSelect={onSelectPark}
          onContribute={onContribute}
          parkName={parkName}
          t={t}
        />
      )}
      <footer className="sidebar-attribution">
        Geodata: <a href="https://www.kartor.ax/" target="_blank" rel="noopener">Ålands landskapsregering</a>{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>
      </footer>
    </aside>
  )
}
