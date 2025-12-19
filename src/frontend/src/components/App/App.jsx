import { useCallback, useEffect, useMemo, useState } from 'react'
import AdminDashboard from '../AdminDashboard/AdminDashboard'
import ApprovalDashboard from '../ApprovalDashboard/ApprovalDashboard'
import EventDetail from '../EventDetail/EventDetail'
import DevHelp from '../DevHelp/DevHelp'
import Header from '../Header/Header'
import LoginPane from '../LoginPane/LoginPane'
import StudentDashboard from '../StudentDashboard/StudentDashboard'
import { api } from '../../services/api'
import cloudBand from '../../assets/cloud-bg-2.jpg'
import skyline from '../../assets/building.png'
import portalLogo from '../../assets/logo.png'
import './App.scss'

function App() {
  const [user, setUser] = useState(null)
  const [theme, setTheme] = useState('light')
  const [detailEventId, setDetailEventId] = useState(() => new URLSearchParams(window.location.search).get('eventId'))

  useEffect(() => {
    api('/api/auth/me')
      .then((u) => setUser(u))
      .catch(() => setUser(null))
  }, [])

  useEffect(() => {
    const handlePop = () => {
      const params = new URLSearchParams(window.location.search)
      setDetailEventId(params.get('eventId'))
    }
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
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

  const openEventDetail = useCallback((eventId) => {
    setDetailEventId(eventId)
    const params = new URLSearchParams(window.location.search)
    params.set('eventId', eventId)
    const newQuery = params.toString()
    const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}`
    window.history.pushState({}, '', newUrl)
  }, [])

  const clearDetailEvent = () => {
    const params = new URLSearchParams(window.location.search)
    params.delete('eventId')
    const newQuery = params.toString()
    const newUrl = `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}`
    window.history.replaceState({}, '', newUrl)
    setDetailEventId(null)
  }

  const dashboardContent = useMemo(() => {
    if (!user) return null
    if (detailEventId)
      return (
        <div className="tabbed-detail">
          <div className="inline-tabs">
            <button className="tab-chip" onClick={clearDetailEvent}>
              Back to dashboard
            </button>
            <button className="tab-chip active" disabled>
              Event detail
            </button>
          </div>
          <EventDetail eventId={detailEventId} user={user} onBack={clearDetailEvent} />
        </div>
      )
    if (user.role === 'STUDENT') return <StudentDashboard onOpenEvent={openEventDetail} />
    if (['SA_OFFICE', 'FACULTY_COORDINATOR', 'DEAN'].includes(user.role))
      return <ApprovalDashboard role={user.role} onOpenEvent={openEventDetail} />
    if (['ADMIN', 'DEV'].includes(user.role)) return <AdminDashboard />
    return <div className="panel">Unknown role</div>
  }, [user, detailEventId, openEventDetail])

  return (
    <div className="layout">
      {user && <Header user={user} onLogout={logout} onToggleTheme={toggleTheme} theme={theme} />}
      <main className={user ? 'content-main' : 'auth-main'}>
        {user ? (
          <div className="page-shell">
            {dashboardContent}
            {user?.role === 'DEV' && <DevHelp />}
          </div>
        ) : (
          <div className="auth-hero">
            <img src={cloudBand} alt="" className="cloud-band" aria-hidden="true" />

            <div className="auth-header">
              <img src={portalLogo} alt="Events Portal logo" className="brand-mark" />
            </div>

            <div className="auth-body">
              <div className={"login-body"}>
                <div className="brand-panel">
                  <div className="brand-copy">
                    <span className="brand-name">Events Portal</span>
                    <span className="brand-tagline">Campus Events Gateway</span>
                  </div>
                </div>
                <LoginPane onLogin={(u) => setUser(u)} />
              </div>
              <img src={skyline} alt="Campus skyline" className="skyline-graphic" />
            </div>
            <div className="auth-footer">
              Powered by <span className="footer-accent">IT Department</span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App
