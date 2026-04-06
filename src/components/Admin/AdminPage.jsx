import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth.js'
import LoginForm from './LoginForm.jsx'
import AdminPanel from './AdminPanel.jsx'

export default function AdminPage() {
  const { i18n } = useTranslation()
  const tAdmin = i18n.getFixedT('en')
  const { session, loading, login, logout } = useAuth()

  if (loading) return <div className="admin-loading">…</div>
  if (!session) return <LoginForm onLogin={login} t={tAdmin} />
  return <AdminPanel onLogout={logout} t={tAdmin} />
}
