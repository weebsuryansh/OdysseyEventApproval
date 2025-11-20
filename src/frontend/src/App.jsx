import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080'

const api = async (url, options = {}) => {
  const target = url.startsWith('http') ? url : `${API_BASE}${url}`
  const response = await fetch(target, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!response.ok) {
    const text = await response.text()
    throw new Error(text || 'Request failed')
  }
  if (response.status === 204) return null
  return response.json()
}

function LoginPane({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const user = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      })
      onLogin(user)
    } catch (err) {
      setError('Login failed')
    }
  }

  return (
    <div className="panel">
      <h2>Log in</h2>
      <form onSubmit={submit} className="stack">
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} />
        </label>
        <label>
          Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </label>
        {error && <div className="error">{error}</div>}
        <button type="submit">Sign in</button>
      </form>
      <p className="hint">
        Default accounts are created at startup with password set to &lt;username&gt;123. Examples: admin/admin123, dev/dev123,
        student/student123, sa/sa123, faculty/faculty123, dean/dean123.
      </p>
    </div>
  )
}

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    if (newPassword !== confirm) {
      setError('New passwords do not match')
      return
    }
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      setMessage('Password updated. Use the new password next time you sign in.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
    } catch (err) {
      setError('Could not update password. Double-check your current password and try again.')
    }
  }

  return (
    <div className="panel">
      <h2>Change password</h2>
      <form className="stack" onSubmit={submit}>
        <label>
          Current password
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required />
        </label>
        <label>
          New password
          <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
        </label>
        <label>
          Confirm new password
          <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
        </label>
        {error && <div className="error">{error}</div>}
        {message && <div className="success">{message}</div>}
        <button type="submit">Update password</button>
      </form>
    </div>
  )
}

function StudentDashboard({ refreshSignal }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [events, setEvents] = useState([])
  const [message, setMessage] = useState('')

  const load = async () => {
    const data = await api('/api/events/mine')
    setEvents(data)
  }

  useEffect(() => {
    load()
  }, [refreshSignal])

  const submit = async (e) => {
    e.preventDefault()
    setMessage('')
    await api('/api/events', {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    })
    setTitle('')
    setDescription('')
    setMessage('Submitted for SA Office review')
    load()
  }

  return (
    <div className="panel">
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
        <button type="submit">Submit</button>
        {message && <div className="success">{message}</div>}
      </form>
      <h3>My requests</h3>
      <EventTable events={events} showStudent={false} />
    </div>
  )
}

function ApprovalDashboard({ role }) {
  const [events, setEvents] = useState([])
  const [remarks, setRemarks] = useState({})

  const load = async () => {
    const data = await api('/api/events/pending')
    setEvents(data)
  }

  useEffect(() => {
    load()
  }, [])

  const act = async (id, approve) => {
    await api(`/api/events/${id}/decision`, {
      method: 'POST',
      body: JSON.stringify({ approve, remark: remarks[id] || '' }),
    })
    load()
  }

  return (
    <div className="panel">
      <h2>{role.replace('_', ' ')} queue</h2>
      {events.map((ev) => (
        <div key={ev.id} className="card">
          <div className="card-header">
            <strong>{ev.title}</strong>
            <span className="badge">Stage: {ev.stage}</span>
          </div>
          <p>{ev.description}</p>
          <p className="muted">Student: {ev.studentName}</p>
          <textarea
            placeholder="Add a remark (required when declining)"
            value={remarks[ev.id] || ''}
            onChange={(e) => setRemarks({ ...remarks, [ev.id]: e.target.value })}
          />
          <div className="actions">
            <button onClick={() => act(ev.id, true)}>Approve</button>
            <button className="danger" onClick={() => act(ev.id, false)}>
              Decline
            </button>
          </div>
        </div>
      ))}
      {events.length === 0 && <p>No pending requests for you right now.</p>}
    </div>
  )
}

function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ username: '', displayName: '', password: '', role: 'STUDENT' })
  const [eventId, setEventId] = useState('')
  const [status, setStatus] = useState('APPROVED')
  const [remark, setRemark] = useState('')

  const load = async () => {
    const data = await api('/api/admin/users')
    setUsers(data)
  }

  useEffect(() => {
    load()
  }, [])

  const submit = async (e) => {
    e.preventDefault()
    await api('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(form),
    })
    setForm({ username: '', displayName: '', password: '', role: 'STUDENT' })
    load()
  }

  const override = async (e) => {
    e.preventDefault()
    await api(`/api/admin/events/${eventId}/override?status=${status}&remark=${encodeURIComponent(remark)}`, { method: 'POST' })
    setEventId('')
    setRemark('')
  }

  return (
    <div className="panel">
      <h2>Admin controls</h2>
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
        </form>
        <div className="stack">
          <h3>Override event</h3>
          <form className="stack" onSubmit={override}>
            <label>
              Event ID
              <input value={eventId} onChange={(e) => setEventId(e.target.value)} required />
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
              <input value={remark} onChange={(e) => setRemark(e.target.value)} />
            </label>
            <button type="submit">Apply override</button>
          </form>
        </div>
      </div>
      <h3>All users</h3>
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
  )
}

function DevHelp() {
  return (
    <div className="panel info">
      <h2>Developer shortcuts</h2>
      <p>
        Use these sample accounts to exercise every stage without creating data manually. Each role will see their tailored dashboard after login. All
        default passwords follow the &lt;username&gt;123 convention.
      </p>
      <ul>
        <li>Student: student / student123</li>
        <li>SA Office: sa / sa123</li>
        <li>Faculty Coordinator: faculty / faculty123</li>
        <li>Dean: dean / dean123</li>
        <li>Admin: admin / admin123</li>
        <li>Dev: dev / dev123</li>
      </ul>
      <p className="hint">Sessions expire after 10 minutes of inactivity for safety.</p>
    </div>
  )
}

function EventTable({ events, showStudent = true }) {
  return (
    <table className="event-table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Title</th>
          <th>Stage</th>
          <th>SA</th>
          <th>Faculty</th>
          <th>Dean</th>
          {showStudent && <th>Student</th>}
        </tr>
      </thead>
      <tbody>
        {events.map((ev) => (
          <tr key={ev.id}>
            <td>{ev.id}</td>
            <td>{ev.title}</td>
            <td>{ev.stage}</td>
            <td>{ev.saStatus}</td>
            <td>{ev.facultyStatus}</td>
            <td>{ev.deanStatus}</td>
            {showStudent && <td>{ev.studentName}</td>}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [refresh, setRefresh] = useState(0)

  useEffect(() => {
    api('/api/auth/me')
      .then((u) => setUser(u))
      .catch(() => setUser(null))
  }, [])

  const logout = async () => {
    await api('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  const content = useMemo(() => {
    if (!user) return <LoginPane onLogin={(u) => setUser(u)} />
    if (user.role === 'STUDENT') return <StudentDashboard refreshSignal={refresh} />
    if (['SA_OFFICE', 'FACULTY_COORDINATOR', 'DEAN'].includes(user.role)) return <ApprovalDashboard role={user.role} />
    if (['ADMIN', 'DEV'].includes(user.role)) return <AdminDashboard />
    return <div className="panel">Unknown role</div>
  }, [user, refresh])

  return (
    <div className="layout">
      <header className="topbar">
        <div className="brand">Odyssey Event Approval</div>
        {user && (
          <div className="user-bar">
            <span>{user.displayName} ({user.role})</span>
            <button onClick={logout}>Logout</button>
          </div>
        )}
      </header>
      <main>
        {content}
        {user && <ChangePasswordCard />}
        {user?.role === 'DEV' && <DevHelp />}
      </main>
    </div>
  )
}

export default App
