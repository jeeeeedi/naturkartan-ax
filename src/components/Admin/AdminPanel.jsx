import { useState } from 'react'
import { useParks } from '../../hooks/useParks.js'
import { useCategories } from '../../hooks/useCategories.js'
import { useArcGISSync } from '../../hooks/useArcGISSync.js'
import { supabase } from '../../lib/supabase.js'
import ParkForm from './ParkForm.jsx'
import ContributionReview from './ContributionReview.jsx'

export default function AdminPanel({ onLogout, t }) {
  const { parks, loading, refetch } = useParks()
  const { categories } = useCategories()
  const categoryMap = Object.fromEntries((categories ?? []).map(c => [c.id, c]))
  const { sync } = useArcGISSync()
  const [tab, setTab] = useState('parks') // 'parks' | 'contributions'
  const [editing, setEditing] = useState(null) // null = list, 'new' = new form, park = edit form
  const [syncStatus, setSyncStatus] = useState(null) // null | { state: 'running'|'done'|'error', message }

  async function handleArcGISSync() {
    setSyncStatus({ state: 'running', message: 'Startar synkronisering…' })
    try {
      const count = await sync((msg) => setSyncStatus({ state: 'running', message: msg }))
      setSyncStatus({ state: 'done', message: count === 0 ? 'Inga ändringar.' : `${count} leder uppdaterade.` })
      refetch()
    } catch (err) {
      setSyncStatus({ state: 'error', message: `Fel: ${err.message}` })
    }
  }

  async function handleDelete(park) {
    if (!confirm(t('adminDeleteConfirm'))) return
    await supabase.from('items').delete().eq('id', park.id)
    refetch()
  }

  async function handleSave(data) {
    if (editing === 'new') {
      await supabase.from('items').insert(data)
    } else {
      await supabase.from('items').update(data).eq('id', editing.id)
    }
    refetch()
    setEditing(null)
  }

  return (
    <div className="admin-wrapper">
      <header className="admin-header">
        <h1>{t('adminTitle')}</h1>
        <nav className="admin-tabs">
          <button className={tab === 'parks' ? 'active' : ''} onClick={() => setTab('parks')}>
            {t('adminItems')} ({parks.length})
          </button>
          <button className={tab === 'contributions' ? 'active' : ''} onClick={() => setTab('contributions')}>
            {t('adminContributions')}
          </button>
        </nav>
        <button className="btn-secondary admin-logout" onClick={onLogout}>{t('adminLogout')}</button>
      </header>

      <div className="admin-body">
        {tab === 'parks' && (
          editing ? (
            <ParkForm
              park={editing === 'new' ? null : editing}
              categories={categories}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
              t={t}
            />
          ) : (
            <div className="parks-list-admin">
              <div className="parks-list-actions">
                <button className="btn-primary" onClick={() => setEditing('new')}>
                  + {t('adminAddItem')}
                </button>
                <button
                  className="btn-secondary"
                  onClick={handleArcGISSync}
                  disabled={syncStatus?.state === 'running'}
                >
                  <span className="icon" style={{fontSize:'15px',marginRight:'4px'}}>sync</span> Synka från ArcGIS
                </button>
              </div>
              {syncStatus && (
                <p className={`sync-status sync-status--${syncStatus.state}`}>
                  {syncStatus.message}
                </p>
              )}
              {loading ? <p>…</p> : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Namn</th>
                      <th>Kategori</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parks.map(p => (
                      <tr key={p.id}>
                        <td>{p.name_sv}</td>
                        <td>{categoryMap[p.category_id]?.label_sv ?? p.category_id}</td>
                        <td className="admin-row-actions">
                          <button onClick={() => setEditing(p)}><span className="icon">edit</span></button>
                          <button onClick={() => handleDelete(p)}><span className="icon">delete</span></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )
        )}

        {tab === 'contributions' && (
          <ContributionReview onApplied={refetch} t={t} />
        )}
      </div>
    </div>
  )
}
