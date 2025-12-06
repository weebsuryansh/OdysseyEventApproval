import { useEffect, useState } from 'react'
import Banner from '../Banner/Banner'
import ChangePasswordCard from '../ChangePasswordCard/ChangePasswordCard'
import EventCard from '../EventCard/EventCard'
import TabNavigation from '../TabNavigation/TabNavigation'
import { api } from '../../services/api'
import './StudentDashboard.scss'

const STAGES_COMPLETE = ['APPROVED', 'REJECTED']

function StudentDashboard() {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [events, setEvents] = useState([])
  const [message, setMessage] = useState({ type: '', text: '' })
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('pending')

  const load = async () => {
    setLoading(true)
    try {
      const data = await api('/api/events/mine')
      setEvents(data)
      setMessage({ type: '', text: '' })
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
        body: JSON.stringify({ title, description }),
      })
      setTitle('')
      setDescription('')
      setMessage({ type: 'success', text: 'Submitted for SA Office review.' })
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
    { label: 'Pending', value: 'pending' },
    { label: 'Past', value: 'past' },
    { label: 'New request', value: 'new' },
    { label: 'Change password', value: 'password' },
  ]

  return (
    <div className="student-layout">
      <TabNavigation tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <div className="tab-content">
        {activeTab === 'pending' && (
          <div className="panel card-surface">
            <div className="panel-header">
              <div>
                <p className="muted">Track each step of your submissions</p>
                <h2>Pending requests</h2>
              </div>
              <button className="ghost" onClick={load} disabled={loading}>
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
