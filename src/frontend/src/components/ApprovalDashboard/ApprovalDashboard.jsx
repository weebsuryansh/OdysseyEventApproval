import { useEffect, useMemo, useState } from 'react'
import Banner from '../Banner/Banner'
import EventCard from '../EventCard/EventCard'
import TabNavigation from '../TabNavigation/TabNavigation'
import { api, downloadFile } from '../../services/api'
import './ApprovalDashboard.scss'

function ApprovalDashboard({ role }) {
  const [events, setEvents] = useState([])
  const [remarks, setRemarks] = useState({})
  const [message, setMessage] = useState({ type: '', text: '' })
  const [working, setWorking] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')
  const [history, setHistory] = useState([])
  const [historyTab, setHistoryTab] = useState('APPROVED')
  const [historyMessage, setHistoryMessage] = useState({ type: '', text: '' })
  const [historyLoading, setHistoryLoading] = useState(false)
  const [sortOrder, setSortOrder] = useState('DESC')
  const [clubFilter, setClubFilter] = useState('ALL')
  const [clubs, setClubs] = useState([])
  const [downloadMessage, setDownloadMessage] = useState({ type: '', text: '' })
  const [downloadWorkingId, setDownloadWorkingId] = useState(null)

  const calcTotal = (items = []) => items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
  const formatAmount = (value) => Number(value || 0).toFixed(2)

  const tabs = [
    { label: 'Pending queue', value: 'pending', variant: 'primary' },
    { label: 'History', value: 'history' },
  ]

  const load = async () => {
    try {
      const data = await api('/api/events/pending')
      setEvents(data)
      setMessage({ type: '', text: '' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not load pending events.' })
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

  const act = async (id, approve) => {
    setWorking(true)
    setMessage({ type: '', text: '' })
    if (!approve && !remarks[id]?.trim()) {
      setWorking(false)
      setMessage({ type: 'error', text: 'Please add a remark before declining.' })
      return
    }
    try {
      await api(`/api/events/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ approve, remark: remarks[id] || '' }),
      })
      setMessage({ type: 'success', text: approve ? 'Request approved.' : 'Request declined.' })
      load()
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Action failed. Please try again.' })
    } finally {
      setWorking(false)
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
              <button className="ghost refresh-button" onClick={load} disabled={working}>
                {working ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            <Banner status={message} />
            <Banner status={downloadMessage} />
            {events.map((ev) => (
              <div key={ev.id} className="queue-card">
                <div className="card-header">
                  <div>
                    <p className="muted">Request #{ev.id}</p>
                    <strong>{ev.title}</strong>
                  </div>
                  <span className="badge">Stage: {ev.stage}</span>
                </div>
                <p>{ev.description}</p>
                <p className="muted">Student: {ev.studentName}</p>
                {ev.subEvents?.length > 0 && (
                  <div className="poc-summary">
                    <p className="muted">Sub-events / POCs</p>
                    <div className="poc-summary-list">
                      {ev.subEvents.map((sub) => (
                        <div key={sub.id} className="poc-summary-row">
                          <div>
                            <strong>{sub.name}</strong>
                            <p className="muted">POC: {sub.pocName} ({sub.pocUsername})</p>
                            <p className="muted">Club: {sub.clubName}</p>
                            <p className="muted">Budget head: {sub.budgetHead}</p>
                            <p className="muted">Total budget: {formatAmount(sub.budgetTotal ?? calcTotal(sub.budgetItems))}</p>
                            {sub.budgetItems?.length > 0 && (
                              <div className="budget-table">
                                <div className="budget-table__header">
                                  <span>Description</span>
                                  <span>Amount</span>
                                </div>
                                {sub.budgetItems.map((item, idx) => (
                                  <div key={idx} className="budget-table__row">
                                    <span>{item.description}</span>
                                    <span>{Number(item.amount || 0).toFixed(2)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className={`poc-status ${sub.status.toLowerCase()}`}>{sub.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <textarea
                  placeholder="Add a remark (required when declining)"
                  value={remarks[ev.id] || ''}
                  onChange={(e) => setRemarks({ ...remarks, [ev.id]: e.target.value })}
                />
                <div className="actions queue-actions">
                  <button disabled={working} onClick={() => act(ev.id, true)}>
                    {working ? 'Working...' : 'Approve'}
                  </button>
                  <button className="danger" disabled={working} onClick={() => act(ev.id, false)}>
                    Decline
                  </button>
                  <button
                    className="ghost"
                    disabled={downloadWorkingId === ev.id}
                    onClick={() => downloadBudget(ev.id)}
                  >
                    {downloadWorkingId === ev.id ? 'Preparing PDF...' : 'Download PDF'}
                  </button>
                </div>
              </div>
            ))}
            {events.length === 0 && <p className="muted">No pending requests for you right now.</p>}
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
