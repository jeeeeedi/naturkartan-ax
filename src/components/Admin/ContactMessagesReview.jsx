import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase.js'

export default function ContactMessagesReview({ t }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('contact_messages')
      .select('*')
      .order('created_at', { ascending: false })
    setMessages(data ?? [])
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function setStatus(id, status) {
    await supabase
      .from('contact_messages')
      .update({ status })
      .eq('id', id)

    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, status } : m)))
  }

  if (loading) return <p>...</p>
  if (messages.length === 0) return <p>{t('adminNoContactMessages')}</p>

  return (
    <div className="contributions-list">
      <h2>{t('adminContactMessages')} ({messages.length})</h2>
      {messages.map((m) => (
        <div key={m.id} className="contribution-card">
          <div className="contribution-meta">
            <span className={`contact-status-pill ${m.status}`}>{m.status}</span>
            <span>{new Date(m.created_at).toLocaleString()}</span>
          </div>

          <p className="contact-msg-line"><strong>{t('contactName')}:</strong> {m.name}</p>
          <p className="contact-msg-line"><strong>{t('contactEmail')}:</strong> {m.email}</p>
          <p className="contact-msg-body">{m.message}</p>

          <div className="form-actions">
            {m.status === 'new' && (
              <button className="btn-secondary" onClick={() => setStatus(m.id, 'read')}>
                {t('adminMarkRead')}
              </button>
            )}
            {m.status !== 'archived' && (
              <button className="btn-secondary" onClick={() => setStatus(m.id, 'archived')}>
                {t('adminMarkArchived')}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
