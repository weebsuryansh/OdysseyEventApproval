import { useEffect, useState } from 'react'
import Banner from '../Banner/Banner'
import { api } from '../../services/api'
import './ApprovalDashboard.scss'

function ApprovalDashboard({ role }) {
  const [events, setEvents] = useState([])
  const [remarks, setRemarks] = useState({})
  const [message, setMessage] = useState({ type: '', text: '' })
  const [working, setWorking] = useState(false)

  const load = async () => {
    try {
      const data = await api('/api/events/pending')
      setEvents(data)
      setMessage({ type: '', text: '' })
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not load pending events.' })
    }
  }

  useEffect(() => {
    load()
  }, [])

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
    <div className="panel card-surface">
      <div className="panel-header">
        <h2>{role.replace('_', ' ')} queue</h2>
        <button className="ghost refresh-button" onClick={load} disabled={working}>
          {working ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      <Banner status={message} />
      {events.map((ev) => (
        <div key={ev.id} className="queue-card">
          <div className="card-header">
            <strong>{ev.title}</strong>
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
                      <p className="muted">Club: {sub.clubName}</p>
                      <p className="muted">Budget: ₹{Number(sub.budgetHead).toFixed(2)}</p>
                      {sub.budgetItems?.length > 0 && (
                        <ul className="budget-mini">
                          {sub.budgetItems.map((item, idx) => (
                            <li key={idx}>
                              <span>{item.description}</span>
                              <span>₹{Number(item.amount).toFixed(2)}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <p className="muted">POC: {sub.pocName} ({sub.pocUsername})</p>
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
          <div className="actions">
            <button disabled={working} onClick={() => act(ev.id, true)}>
              {working ? 'Working...' : 'Approve'}
            </button>
            <button className="danger" disabled={working} onClick={() => act(ev.id, false)}>
              Decline
            </button>
          </div>
        </div>
      ))}
      {events.length === 0 && <p className="muted">No pending requests for you right now.</p>}
    </div>
  )
}

export default ApprovalDashboard
