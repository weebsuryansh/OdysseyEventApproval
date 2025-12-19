import { useEffect, useMemo, useState } from 'react'
import Banner from '../Banner/Banner'
import EventCard from '../EventCard/EventCard'
import TabNavigation from '../TabNavigation/TabNavigation'
import { api, downloadFile } from '../../services/api'
import './ApprovalDashboard.scss'

function ApprovalDashboard({ role, onOpenEvent = () => {} }) {
  const [events, setEvents] = useState([])
  const [message, setMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState('pending')
  const [history, setHistory] = useState([])
  const [historyTab, setHistoryTab] = useState('APPROVED')
  const [historyMessage, setHistoryMessage] = useState({ type: '', text: '' })
  const [historyLoading, setHistoryLoading] = useState(false)
  const [pendingLoading, setPendingLoading] = useState(false)
  const [sortOrder, setSortOrder] = useState('DESC')
  const [clubFilter, setClubFilter] = useState('ALL')
  const [clubs, setClubs] = useState([])
  const [downloadMessage, setDownloadMessage] = useState({ type: '', text: '' })
  const [downloadWorkingId, setDownloadWorkingId] = useState(null)

  const tabs = [
    { label: 'Pending queue', value: 'pending', variant: 'primary' },
    { label: 'History', value: 'history' },
  ]

  const load = async () => {
    setPendingLoading(true)
    try {
      const data = await api('/api/events/pending')
      setEvents(data)
      setMessage({ type: '', text: '' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not load pending events.' })
    } finally {
      setPendingLoading(false)
    }
  }

  const loadHistory = async (order = sortOrder) => {
    setHistoryLoading(true)
    try {
      const data = await api(`/api/events/history?sort=${order}`)
      setHistory(data)
      setHistoryMessage({ type: '', text: '' })
    } catch (err) {
      setHistoryMessage({ type: 'error', text: err.message || 'Could not load history.' })
    } finally {
      setHistoryLoading(false)
    }
  }

  const loadClubs = async () => {
    try {
      const data = await api('/api/clubs')
      setClubs(data)
    } catch (_) {
      // non-blocking
    }
  }

  useEffect(() => {
    load()
    loadClubs()
  }, [])

  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory(sortOrder)
    }
  }, [activeTab, sortOrder])

  const statusForRole = (ev) => {
    if (role === 'SA_OFFICE') return ev.saStatus
    if (role === 'FACULTY_COORDINATOR') return ev.facultyStatus
    return ev.deanStatus
  }

  const filteredHistory = useMemo(() => {
    const desiredStatus = historyTab === 'APPROVED' ? 'APPROVED' : 'REJECTED'
    return history
      .filter((ev) => statusForRole(ev) === desiredStatus)
      .filter((ev) => clubFilter === 'ALL' || ev.subEvents?.some((sub) => `${sub.clubId}` === clubFilter))
  }, [history, historyTab, clubFilter])

  const clubOptions = useMemo(() => {
    const seen = new Map()
    clubs.forEach((club) => seen.set(String(club.id), club.name))
    history.forEach((ev) => ev.subEvents?.forEach((sub) => seen.set(String(sub.clubId), sub.clubName)))
    return Array.from(seen.entries()).map(([id, name]) => ({ id, name }))
  }, [clubs, history])

  const downloadBudget = async (eventId) => {
    setDownloadWorkingId(eventId)
    const setBanner = activeTab === 'history' ? setHistoryMessage : setMessage
    setDownloadMessage({ type: '', text: '' })
    setBanner({ type: '', text: '' })
    try {
      await downloadFile(`/api/events/${eventId}/budget.pdf`, `event-${eventId}-budget.pdf`)
      setDownloadMessage({ type: 'success', text: 'Budget PDF downloaded.' })
    } catch (err) {
      setDownloadMessage({ type: 'error', text: err.message || 'Could not download budget PDF.' })
    } finally {
      setDownloadWorkingId(null)
    }
  }

  return (
    <div className="approval-layout">
      <TabNavigation tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <div className="tab-content">
        {activeTab === 'pending' && (
          <div className="panel card-surface">
            <div className="panel-header">
              <h2>{role.replace('_', ' ')} queue</h2>
              <button className="ghost refresh-button" onClick={load} disabled={pendingLoading}>
                {pendingLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <Banner status={message} />
            <Banner status={downloadMessage} />
            {pendingLoading && <p className="muted">Loading your queue...</p>}
            {!pendingLoading &&
              events.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onDownload={() => downloadBudget(ev.id)}
                  downloading={downloadWorkingId === ev.id}
                  onOpen={(id) => onOpenEvent(id)}
                />
              ))}
            {!pendingLoading && events.length === 0 && <p className="muted">No pending requests for you right now.</p>}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="panel card-surface">
            <div className="panel-header">
              <h2>Past decisions</h2>
              <div className="history-actions">
                <label>
                  Sort
                  <select value={sortOrder} onChange={(e) => setSortOrder(e.target.value)}>
                    <option value="DESC">Latest to oldest</option>
                    <option value="ASC">Oldest to latest</option>
                  </select>
                </label>
                <button className="ghost compact" onClick={() => loadHistory(sortOrder)} disabled={historyLoading}>
                  {historyLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
            </div>

            <div className="history-tabs">
              {['APPROVED', 'REJECTED'].map((status) => (
                <button
                  key={status}
                  className={`tab-chip ${historyTab === status ? 'active' : ''}`}
                  onClick={() => setHistoryTab(status)}
                >
                  {status === 'APPROVED' ? 'Approved' : 'Declined'}
                </button>
              ))}
            </div>

            <div className="history-filters">
              <label>
                Club filter
                <select value={clubFilter} onChange={(e) => setClubFilter(e.target.value)}>
                  <option value="ALL">All clubs</option>
                  {clubOptions.map((club) => (
                    <option key={club.id} value={club.id}>
                      {club.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <Banner status={historyMessage} />
            <Banner status={downloadMessage} />
            {historyLoading ? (
              <p className="muted">Loading your decisions...</p>
            ) : (
              filteredHistory.map((ev) => (
                <EventCard
                  key={ev.id}
                  event={ev}
                  onDownload={() => downloadBudget(ev.id)}
                  downloading={downloadWorkingId === ev.id}
                  onOpen={(id) => onOpenEvent(id, { readOnly: true })}
                />
              ))
            )}
            {!historyLoading && filteredHistory.length === 0 && (
              <p className="muted">No events match your filters yet.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default ApprovalDashboard
