import { useEffect, useMemo, useState } from 'react'
import Banner from '../Banner/Banner'
import ChangePasswordCard from '../ChangePasswordCard/ChangePasswordCard'
import EventStatusPill from '../EventStatusPill/EventStatusPill'
import TabNavigation from '../TabNavigation/TabNavigation'
import { api } from '../../services/api'
import './AdminDashboard.scss'

const tabs = [
  { label: 'Override events', value: 'override', variant: 'primary' },
  { label: 'User management', value: 'users' },
  { label: 'Change password', value: 'password' },
]

function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ username: '', displayName: '', password: '', role: 'STUDENT' })
  const [status, setStatus] = useState('APPROVED')
  const [targetStage, setTargetStage] = useState('DEAN')
  const [remark, setRemark] = useState('')
  const [loadMessage, setLoadMessage] = useState({ type: '', text: '' })
  const [createMessage, setCreateMessage] = useState({ type: '', text: '' })
  const [overrideMessage, setOverrideMessage] = useState({ type: '', text: '' })
  const [activeTab, setActiveTab] = useState('override')

  const [events, setEvents] = useState([])
  const [eventsMessage, setEventsMessage] = useState({ type: '', text: '' })
  const [eventsLoading, setEventsLoading] = useState(false)
  const [eventSearch, setEventSearch] = useState('')
  const [selectedEvent, setSelectedEvent] = useState(null)

  const loadUsers = async () => {
    try {
      const data = await api('/api/admin/users')
      setUsers(data)
      setLoadMessage({ type: '', text: '' })
    } catch (err) {
      setLoadMessage({ type: 'error', text: err.message || 'Could not load users. Make sure you are signed in as an admin.' })
    }
  }

  const loadEvents = async () => {
    setEventsLoading(true)
    try {
      const data = await api('/api/admin/events')
      setEvents(data)
      setEventsMessage({ type: '', text: '' })
      if (selectedEvent) {
        const updated = data.find((ev) => ev.id === selectedEvent.id)
        setSelectedEvent(updated || null)
      }
    } catch (err) {
      setEventsMessage({ type: 'error', text: err.message || 'Could not load events. Please try again.' })
    } finally {
      setEventsLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
    loadEvents()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    setCreateMessage({ type: '', text: '' })
    try {
      await api('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(form),
      })
      setForm({ username: '', displayName: '', password: '', role: 'STUDENT' })
      setCreateMessage({ type: 'success', text: 'User created successfully.' })
      loadUsers()
    } catch (err) {
      setCreateMessage({ type: 'error', text: err.message || 'Could not create user.' })
    }
  }

  const override = async (e) => {
    e.preventDefault()
    if (!selectedEvent) return
    setOverrideMessage({ type: '', text: '' })
    if (status === 'REJECTED' && !remark.trim()) {
      setOverrideMessage({ type: 'error', text: 'Remark is required when rejecting.' })
      return
    }
    try {
      await api(
        `/api/admin/events/${selectedEvent.id}/override?target=${targetStage}&status=${status}&remark=${encodeURIComponent(remark)}`,
        {
          method: 'POST',
        }
      )
      setRemark('')
      setTargetStage('DEAN')
      setOverrideMessage({ type: 'success', text: 'Override applied.' })
      loadEvents()
    } catch (err) {
      setOverrideMessage({ type: 'error', text: err.message || 'Override failed.' })
    }
  }

  const filteredEvents = useMemo(() => {
    const term = eventSearch.trim().toLowerCase()
    if (!term) return events
    return events.filter((ev) =>
      `${ev.id}`.includes(term) || ev.title.toLowerCase().includes(term) || ev.studentName.toLowerCase().includes(term)
    )
  }, [events, eventSearch])

  return (
    <div className="admin-layout">
      <TabNavigation tabs={tabs} active={activeTab} onChange={setActiveTab} />
      <div className="tab-content">
        {activeTab === 'users' && (
          <div className="panel card-surface">
            <div className="panel-header">
              <h2>User management</h2>
            </div>
            <div className="grid">
              <form className="stack" onSubmit={submit}>
                <h3>Create user</h3>
                <label>
                  Username
                  <input value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                </label>
                <label>
                  Display name
                  <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} required />
                </label>
                <label>
                  Password
                  <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                </label>
                <label>
                  Role
                  <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    {['STUDENT', 'SA_OFFICE', 'FACULTY_COORDINATOR', 'DEAN', 'ADMIN', 'DEV'].map((role) => (
                      <option key={role}>{role}</option>
                    ))}
                  </select>
                </label>
                <button type="submit">Create</button>
                <Banner status={createMessage} />
              </form>
              <div className="stack">
                <h3>All users</h3>
                <Banner status={loadMessage} />
                <div className="table-wrapper">
                  <table className="user-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Name</th>
                        <th>Role</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id}>
                          <td>{u.id}</td>
                          <td>{u.username}</td>
                          <td>{u.displayName}</td>
                          <td>{u.role}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'override' && (
          <div className="override-layout">
            <div className="panel card-surface">
              <div className="panel-header">
                <div>
                  <p className="muted">Search and pick an event</p>
                  <h2>All events</h2>
                </div>
                <button className="ghost compact refresh-button" onClick={loadEvents} disabled={eventsLoading}>
                  {eventsLoading ? 'Refreshing...' : 'Refresh'}
                </button>
              </div>
              <input
                type="search"
                placeholder="Search by title, student, or ID"
                value={eventSearch}
                onChange={(e) => setEventSearch(e.target.value)}
              />
              <Banner status={eventsMessage} />
              <div className="event-list">
                {filteredEvents.map((ev) => (
                  <button
                    key={ev.id}
                    className={`event-row ${selectedEvent?.id === ev.id ? 'active' : ''}`}
                    onClick={() => setSelectedEvent(ev)}
                  >
                    <div>
                      <p className="muted">Request #{ev.id}</p>
                      <strong>{ev.title}</strong>
                      <p className="muted">{ev.studentName}</p>
                    </div>
                    <span className={`badge stage ${ev.stage?.toLowerCase()}`}>{ev.stage}</span>
                  </button>
                ))}
                {filteredEvents.length === 0 && <p className="muted">No events match your search.</p>}
              </div>
            </div>

            <div className="panel card-surface">
              {!selectedEvent && <p className="muted">Select an event to view its history and override it.</p>}
              {selectedEvent && (
                <div className="event-detail">
                  <div className="panel-header">
                    <div>
                      <p className="muted">Request #{selectedEvent.id}</p>
                      <h2>{selectedEvent.title}</h2>
                      <p className="muted">Student: {selectedEvent.studentName}</p>
                    </div>
                    <span className={`badge stage ${selectedEvent.stage?.toLowerCase()}`}>{selectedEvent.stage}</span>
                  </div>

                  <p className="muted description">{selectedEvent.description}</p>

                  <div className="status-grid">
                    <EventStatusPill label="SA Office" status={selectedEvent.saStatus} remark={selectedEvent.saRemark} />
                    <EventStatusPill label="Faculty" status={selectedEvent.facultyStatus} remark={selectedEvent.facultyRemark} />
                    <EventStatusPill label="Dean" status={selectedEvent.deanStatus} remark={selectedEvent.deanRemark} />
                  </div>

                  <form className="stack" onSubmit={override}>
                    <h3>Override decision</h3>
                    <label>
                      Stage
                      <select value={targetStage} onChange={(e) => setTargetStage(e.target.value)}>
                        <option value="SA">SA Office</option>
                        <option value="FACULTY">Faculty</option>
                        <option value="DEAN">Dean</option>
                      </select>
                    </label>
                    <label>
                      Status
                      <select value={status} onChange={(e) => setStatus(e.target.value)}>
                        <option>APPROVED</option>
                        <option>REJECTED</option>
                      </select>
                    </label>
                    <label>
                      Remark
                      <input value={remark} onChange={(e) => setRemark(e.target.value)} placeholder="Optional remark" />
                    </label>
                    <Banner status={overrideMessage} />
                    <div className="actions">
                      <button type="submit">Apply override</button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'password' && <ChangePasswordCard />}
      </div>
    </div>
  )
}

export default AdminDashboard
