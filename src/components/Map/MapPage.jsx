import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParks } from '../../hooks/useParks.js'
import { useCategories } from '../../hooks/useCategories.js'
import MapView from './MapView.jsx'
import Sidebar from '../Sidebar/Sidebar.jsx'
import ContributeModal from '../Contribute/ContributeModal.jsx'

export default function MapPage() {
  const { t, i18n } = useTranslation()
  const { parks, loading, refetch } = useParks()
  const { categories } = useCategories()

  const [selectedPark, setSelectedPark] = useState(null)
  const [filterCategory, setFilterCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [flyTo, setFlyTo] = useState(null)
  const [contributeOpen, setContributeOpen] = useState(false)
  const [contributeTarget, setContributeTarget] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const lang = i18n.language || 'sv'
  const parkName = (p) => p[`name_${lang}`] || p.name_sv
  const parkDesc = (p) => p[`description_${lang}`] || p.description_sv || ''

  const filteredParks = parks.filter(p => {
    if (filterCategory && p.category_id !== filterCategory) return false
    if (search) {
      const q = search.toLowerCase()
      return parkName(p).toLowerCase().includes(q) ||
        (p.municipality || '').toLowerCase().includes(q)
    }
    return true
  })

  const handleSelectPark = (p) => { setSelectedPark(p); setFlyTo(p) }
  const handleClearPark = () => setSelectedPark(null)
  const handleContribute = (park) => { setContributeTarget(park ?? null); setContributeOpen(true) }

  return (
    <div id="app-wrapper">
      <header id="app-header">
        <button id="sidebar-toggle" aria-label="Toggle sidebar" onClick={() => setSidebarOpen(o => !o)}>
          <span /><span /><span />
        </button>
        <div id="header-title">
          <span id="park-icon">🌊</span>
          <div>
            <span id="park-name">Naturkartan.ax</span>
            <span id="park-tagline">{t('tagline')}</span>
          </div>
        </div>
        <div id="header-meta">{t('headerMeta')}</div>
        <div id="lang-switcher" role="group" aria-label="Language">
          {['sv', 'en', 'fi'].map(l => (
            <button
              key={l}
              className={`lang-btn${lang === l ? ' active' : ''}`}
              onClick={() => i18n.changeLanguage(l)}
            >
              {l.toUpperCase()}
            </button>
          ))}
        </div>
      </header>

      <div id="app-body">
        <Sidebar
          open={sidebarOpen}
          parks={filteredParks}
          allParks={parks}
          categories={categories}
          loading={loading}
          selectedPark={selectedPark}
          filterCategory={filterCategory}
          search={search}
          onSelectPark={handleSelectPark}
          onClearPark={handleClearPark}
          onFilterCategory={setFilterCategory}
          onSearch={setSearch}
          onContribute={handleContribute}
          parkName={parkName}
          parkDesc={parkDesc}
          t={t}
        />

        <main id="map-container">
          <MapView
            parks={filteredParks}
            categories={categories}
            selectedPark={selectedPark}
            flyTo={flyTo}
            onSelectPark={handleSelectPark}
            parkName={parkName}
          />
        </main>
      </div>

      {contributeOpen && (
        <ContributeModal
          park={contributeTarget}
          categories={categories}
          onClose={() => setContributeOpen(false)}
          onSubmitted={() => { refetch(); setContributeOpen(false) }}
          parkName={parkName}
          t={t}
        />
      )}
    </div>
  )
}
