import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'

export default function AboutContact({ t }) {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)
  const [status, setStatus] = useState('idle') // idle | success | error

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  async function onSubmit(e) {
    e.preventDefault()
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return

    setSending(true)
    setStatus('idle')

    const { error } = await supabase.from('contact_messages').insert({
      name: form.name.trim(),
      email: form.email.trim(),
      message: form.message.trim(),
    })

    setSending(false)
    if (error) {
      setStatus('error')
      return
    }

    setForm({ name: '', email: '', message: '' })
    setStatus('success')
  }

  return (
    <section id="about-contact-section">
      <h2>{t('aboutTitle')}</h2>
      <p className="about-text">{t('aboutBody')}</p>

      <form className="contact-form" onSubmit={onSubmit}>
        <label>
          {t('contactName')}
          <input
            type="text"
            value={form.name}
            onChange={set('name')}
            required
            autoComplete="name"
          />
        </label>

        <label>
          {t('contactEmail')}
          <input
            type="email"
            value={form.email}
            onChange={set('email')}
            required
            autoComplete="email"
          />
        </label>

        <label>
          {t('contactMessage')}
          <textarea
            rows={3}
            value={form.message}
            onChange={set('message')}
            required
          />
        </label>

        <button type="submit" className="btn-primary" disabled={sending}>
          {sending ? t('contactSending') : t('contactSend')}
        </button>

        {status === 'success' && <p className="contact-status ok">{t('contactSuccess')}</p>}
        {status === 'error' && <p className="contact-status err">{t('contactError')}</p>}
      </form>
    </section>
  )
}
