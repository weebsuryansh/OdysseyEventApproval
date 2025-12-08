import { useEffect, useState } from 'react'
import Banner from '../Banner/Banner'
import ChangePasswordCard from '../ChangePasswordCard/ChangePasswordCard'
import EventCard from '../EventCard/EventCard'
import TabNavigation from '../TabNavigation/TabNavigation'
import { api } from '../../services/api'
import './StudentDashboard.scss'

const STAGES_COMPLETE = ['APPROVED', 'REJECTED']
const EMPTY_SUB_EVENT = {
  name: '',
  budgetHead: '',
  budgetBreakdown: '',
  pocUsername: '',
  pocName: '',
  pocPhone: '',
}

function StudentDashboard() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [subEvents, setSubEvents] = useState([{ ...EMPTY_SUB_EVENT }])
  const [events, setEvents] = useState([])
  const [pocRequests, setPocRequests] = useState([])
  const [message, setMessage] = useState({ type: '', text: '' })
  const [pocMessage, setPocMessage] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('home')
  const [pocWorkingId, setPocWorkingId] = useState(null)

  const load = async () => {
    setLoading(true)
    try {
      const [eventsData, pocData] = await Promise.all([
        api('/api/events/mine'),
        api('/api/poc/requests'),
      ])
      setEvents(eventsData)
      setPocRequests(pocData)
      setMessage({ type: '', text: '' })
      setPocMessage({ type: '', text: '' })
    } catch (err) {
      setMessage({ type: 'error', text: 'Could not load your requests. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage({ type: '', text: '' })
    try {
      await api('/api/events', {
        method: 'POST',
        body: JSON.stringify({ title, description, subEvents }),
      })
      setTitle('')
      setDescription('')
      setSubEvents([{ ...EMPTY_SUB_EVENT }])
      setMessage({ type: 'success', text: 'Submitted for POC confirmation.' })
      load()
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Could not submit event.' })
    } finally {
      setSubmitting(false)
    }
  }

  const pending = events.filter((ev) => !STAGES_COMPLETE.includes(ev.stage))
  const past = events.filter((ev) => STAGES_COMPLETE.includes(ev.stage))

  const tabs = [
    { label: 'Home', value: 'home', variant: 'primary' },
    { label: 'New request', value: 'new' },
    { label: 'Pending', value: 'pending' },
    { label: 'Past', value: 'past' },
    { label: 'Change password', value: 'password' },
  ]

  const addSubEvent = () => {
    if (subEvents.length >= 15) {
      setMessage({ type: 'error', text: 'You can add up to 15 sub-events.' })
      return
    }
    setSubEvents([...subEvents, { ...EMPTY_SUB_EVENT }])
  }

  const updateSubEvent = (index, field, value) => {
    const updated = [...subEvents]
    updated[index] = { ...updated[index], [field]: value }
    setSubEvents(updated)
  }

  const removeSubEvent = (index) => {
    if (subEvents.length === 1) return
    const updated = subEvents.filter((_, i) => i !== index)
    setSubEvents(updated)
  }

  const decidePoc = async (id, accept) => {
    setPocWorkingId(id)
    setPocMessage({ type: '', text: '' })
    try {
      await api(`/api/poc/requests/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ accept }),
      })
      setPocMessage({ type: 'success', text: accept ? 'You accepted the POC role.' : 'You declined the POC role.' })
      load()
    } catch (err) {
      setPocMessage({ type: 'error', text: err.message || 'Unable to submit response.' })
    } finally {
      setPocWorkingId(null)
    }
  }

  return (
    <div className="student-layout">
      <TabNavigation tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <div className="tab-content">
        {activeTab === 'home' && (
          <div className="home-grid">
            <div className="panel card-surface">
              <div className="panel-header">
                <div>
                  <p className="muted">Approve or decline POC requests from your peers</p>
                  <h2>POC confirmations</h2>
                </div>
                <button className="ghost refresh-button" onClick={load} disabled={loading || pocWorkingId !== null}>
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <Banner status={pocMessage} />
              {loading && <p className="muted">Loading your POC requests...</p>}
              {!loading &&
                pocRequests.map((req) => (
                  <div key={req.subEventId} className="poc-card">
                    <div className="card-header">
                      <div>
                        <p className="muted">Event #{req.eventId}</p>
                        <h3>{req.eventTitle}</h3>
                      </div>
                      <span className="badge stage poc">Awaiting your response</span>
                    </div>
                    <p>{req.eventDescription}</p>
                    <div className="poc-details">
                      <p>
                        <strong>Sub-event:</strong> {req.subEventName}
                      </p>
                      <p>
                        <strong>Budget head:</strong> {req.budgetHead}
                      </p>
                      <p>
                        <strong>Budget breakdown:</strong> {req.budgetBreakdown}
                      </p>
                      <p className="muted">
                        Requested by {req.requestedBy} · Contact listed: {req.pocName} ({req.pocPhone})
                      </p>
                    </div>
                    <div className="actions">
                      <button disabled={pocWorkingId === req.subEventId} onClick={() => decidePoc(req.subEventId, true)}>
                        {pocWorkingId === req.subEventId ? 'Sending...' : 'Accept'}
                      </button>
                      <button
                        className="danger"
                        disabled={pocWorkingId === req.subEventId}
                        onClick={() => decidePoc(req.subEventId, false)}
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              {!loading && pocRequests.length === 0 && <p className="muted">No POC confirmations are waiting on you.</p>}
            </div>

            <div className="panel card-surface">
              <div className="panel-header">
                <div>
                  <p className="muted">Track each step of your submissions</p>
                  <h2>Pending requests</h2>
                </div>
                <button className="ghost refresh-button" onClick={load} disabled={loading}>
                  {loading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              {loading ? <p className="muted">Loading your requests...</p> : pending.map((ev) => <EventCard key={ev.id} event={ev} />)}
              {!loading && pending.length === 0 && <p className="muted">No pending items right now.</p>}
            </div>
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="panel card-surface">
            <div className="panel-header">
              <h2>Your pending requests</h2>
              <button className="ghost refresh-button" onClick={load} disabled={loading}>
                {loading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            {loading ? <p className="muted">Loading your requests...</p> : pending.map((ev) => <EventCard key={ev.id} event={ev} />)}
            {!loading && pending.length === 0 && <p className="muted">No pending items right now.</p>}
          </div>
        )}

        {activeTab === 'past' && (
          <div className="panel card-surface">
            <h2>Past requests</h2>
            {loading ? <p className="muted">Loading your requests...</p> : past.map((ev) => <EventCard key={ev.id} event={ev} />)}
            {!loading && past.length === 0 && <p className="muted">No past requests yet.</p>}
          </div>
        )}

        {activeTab === 'new' && (
          <div className="panel card-surface">
            <h2>Request new event</h2>
            <form onSubmit={submit} className="stack">
              <label>
                Title
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </label>
              <label>
                Description
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
              </label>

              <div className="subevent-form">
                <div className="subevent-header">
                  <h3>Sub-events</h3>
                  <button type="button" className="ghost" onClick={addSubEvent}>
                    + Add sub-event
                  </button>
                </div>
                {subEvents.map((sub, index) => (
                  <div className="subevent-card" key={index}>
                    <div className="subevent-card-header">
                      <h4>Sub-event #{index + 1}</h4>
                      {subEvents.length > 1 && (
                        <button type="button" className="ghost" onClick={() => removeSubEvent(index)}>
                          Remove
                        </button>
                      )}
                    </div>
                    <label>
                      Sub-event name
                      <input value={sub.name} onChange={(e) => updateSubEvent(index, 'name', e.target.value)} required />
                    </label>
                    <label>
                      Budget head (total)
                      <input value={sub.budgetHead} onChange={(e) => updateSubEvent(index, 'budgetHead', e.target.value)} required />
                    </label>
                    <label>
                      Budget breakdown
                      <textarea
                        value={sub.budgetBreakdown}
                        onChange={(e) => updateSubEvent(index, 'budgetBreakdown', e.target.value)}
                        required
                      />
                    </label>
                    <div className="poc-grid">
                      <label>
                        POC username
                        <input
                          value={sub.pocUsername}
                          onChange={(e) => updateSubEvent(index, 'pocUsername', e.target.value)}
                          required
                        />
                      </label>
                      <label>
                        POC name
                        <input value={sub.pocName} onChange={(e) => updateSubEvent(index, 'pocName', e.target.value)} required />
                      </label>
                      <label>
                        POC phone
                        <input value={sub.pocPhone} onChange={(e) => updateSubEvent(index, 'pocPhone', e.target.value)} required />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit'}
              </button>
              <Banner status={message} />
            </form>
          </div>
        )}

        {activeTab === 'password' && <ChangePasswordCard />}
      </div>
    </div>
  )
}

export default StudentDashboard
