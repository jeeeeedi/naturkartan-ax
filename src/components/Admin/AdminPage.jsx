import { useTranslation } from 'react-i18next'
import { useAuth } from '../../hooks/useAuth.js'
import LoginForm from './LoginForm.jsx'
import AdminPanel from './AdminPanel.jsx'

export default function AdminPage() {
  const { t } = useTranslation()
  const { session, loading, login, logout } = useAuth()

  if (loading) return <div className="admin-loading">…</div>
  if (!session) return <LoginForm onLogin={login} t={t} />
  return <AdminPanel onLogout={logout} t={t} />
}
