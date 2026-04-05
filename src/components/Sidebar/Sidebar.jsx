import { useTranslation } from 'react-i18next'
import ParkList from './ParkList.jsx'
import ParkDetail from './ParkDetail.jsx'

export default function Sidebar({
  open, parks, categories, loading, selectedPark,
  filterCategory, search, onSelectPark, onClearPark, onFilterCategory,
  onSearch, onContribute, parkName, parkDesc, t,
}) {
  const { i18n } = useTranslation()
  const lang = i18n.language || 'sv'
  const catLabel = (cat) => cat[`label_${lang}`] || cat.label_sv

  return (
    <aside id="sidebar" className={open ? '' : 'sidebar--hidden'} aria-label="Information">

      {!selectedPark && (
        <>
          <section id="poi-section">
            <div id="category-filters" role="group" aria-label="Filter by type">
              <button
                className={`cat-filter-btn${!filterCategory ? ' active' : ''}`}
                onClick={() => onFilterCategory(null)}
              >
                {t('filterAll')}
              </button>
              {(categories ?? []).map(cat => (
                <button
                  key={cat.id}
                  className={`cat-filter-btn${filterCategory === cat.id ? ' active' : ''}`}
                  style={filterCategory === cat.id ? { '--btn-color': cat.color } : {}}
                  onClick={() => onFilterCategory(filterCategory === cat.id ? null : cat.id)}
                >
                  <span className="cat-filter-dot" style={{ background: cat.color }} />
                  {catLabel(cat)}
                </button>
              ))}
            </div>
            <div id="poi-search-wrap">
              <span id="poi-search-icon" className="icon">search</span>
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
        <a href="https://www.regeringen.ax/miljo-natur/allemansratten" target="_blank" rel="noopener">Allemansrätten</a>
        {' · '}
        Geodata: <a href="https://www.kartor.ax/" target="_blank" rel="noopener">Ålands landskapsregering</a>{' '}
        <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>
      </footer>
    </aside>
  )
}
