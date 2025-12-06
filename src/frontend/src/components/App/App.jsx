import { useEffect, useMemo, useState } from 'react'
import AdminDashboard from '../AdminDashboard/AdminDashboard'
import ApprovalDashboard from '../ApprovalDashboard/ApprovalDashboard'
import DevHelp from '../DevHelp/DevHelp'
import Header from '../Header/Header'
import LoginPane from '../LoginPane/LoginPane'
import StudentDashboard from '../StudentDashboard/StudentDashboard'
import { api } from '../../services/api'
import './App.scss'

function App() {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState('light')

  useEffect(() => {
    api('/api/auth/me')
      .then((u) => setUser(u))
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  const content = useMemo(() => {
    if (!user)
      return (
        <div className="auth-layout">
          <LoginPane onLogin={(u) => setUser(u)} />
        </div>
      )
    if (user.role === 'STUDENT') return <StudentDashboard />
    if (['SA_OFFICE', 'FACULTY_COORDINATOR', 'DEAN'].includes(user.role)) return <ApprovalDashboard role={user.role} />
    if (['ADMIN', 'DEV'].includes(user.role)) return <AdminDashboard />
    return <div className="panel">Unknown role</div>
  }, [user])

  return (
    <div className="layout">
      <Header user={user} onLogout={logout} onToggleTheme={toggleTheme} theme={theme} />
      <main className={user ? 'content-main' : 'auth-main'}>
        <div className="page-shell">
          {content}
          {user?.role === 'DEV' && <DevHelp />}
        </div>
      </main>
    </div>
  )
}

export default App
