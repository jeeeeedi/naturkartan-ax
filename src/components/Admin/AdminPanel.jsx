import { useState } from 'react'
import { useParks } from '../../hooks/useParks.js'
import { useCategories } from '../../hooks/useCategories.js'
import { supabase } from '../../lib/supabase.js'
import ParkForm from './ParkForm.jsx'
import ContributionReview from './ContributionReview.jsx'

export default function AdminPanel({ onLogout, t }) {
  const { parks, loading, refetch } = useParks()
  const { categories } = useCategories()
  const [tab, setTab] = useState('parks') // 'parks' | 'contributions'
  const [editing, setEditing] = useState(null) // null = list, 'new' = new form, park = edit form

  async function handleDelete(park) {
    if (!confirm(t('adminDeleteConfirm'))) return
    await supabase.from('parks').delete().eq('id', park.id)
    refetch()
  }

  async function handleSave(data) {
    if (editing === 'new') {
      await supabase.from('parks').insert(data)
    } else {
      await supabase.from('parks').update(data).eq('id', editing.id)
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
            {t('adminParks')} ({parks.length})
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
              <button className="btn-primary" onClick={() => setEditing('new')}>
                + {t('adminAddPark')}
              </button>
              {loading ? <p>…</p> : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Namn</th>
                      <th>Kategori</th>
                      <th>Kommun</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {parks.map(p => (
                      <tr key={p.id}>
                        <td>{p.name_sv}</td>
                        <td>{p.category_id}</td>
                        <td>{p.municipality}</td>
                        <td className="admin-row-actions">
                          <button onClick={() => setEditing(p)}>✏️</button>
                          <button onClick={() => handleDelete(p)}>🗑️</button>
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
