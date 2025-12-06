import { useEffect, useState } from 'react'
import Banner from '../Banner/Banner'
import { api } from '../../services/api'
import './AdminDashboard.scss'

function AdminDashboard() {
  const [users, setUsers] = useState([])
  const [form, setForm] = useState({ username: '', displayName: '', password: '', role: 'STUDENT' })
  const [eventId, setEventId] = useState('')
  const [status, setStatus] = useState('APPROVED')
  const [remark, setRemark] = useState('')
  const [loadMessage, setLoadMessage] = useState({ type: '', text: '' })
  const [createMessage, setCreateMessage] = useState({ type: '', text: '' })
  const [overrideMessage, setOverrideMessage] = useState({ type: '', text: '' })

  const load = async () => {
    try {
      const data = await api('/api/admin/users')
      setUsers(data)
      setLoadMessage({ type: '', text: '' })
    } catch (err) {
      setLoadMessage({ type: 'error', text: 'Could not load users. Make sure you are signed in as an admin.' })
    }
  }

  useEffect(() => {
    load()
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
      load()
    } catch (err) {
      setCreateMessage({ type: 'error', text: err.message || 'Could not create user.' })
    }
  }

  const override = async (e) => {
    e.preventDefault()
    setOverrideMessage({ type: '', text: '' })
    try {
      await api(`/api/admin/events/${eventId}/override?status=${status}&remark=${encodeURIComponent(remark)}`, { method: 'POST' })
      setEventId('')
      setRemark('')
      setOverrideMessage({ type: 'success', text: 'Override applied.' })
    } catch (err) {
      setOverrideMessage({ type: 'error', text: err.message || 'Override failed.' })
    }
  }

  return (
    <div className="panel card-surface">
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
          <Banner status={createMessage} />
        </form>
        <div className="stack override-card">
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
            <Banner status={overrideMessage} />
          </form>
        </div>
      </div>
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
  )
}

export default AdminDashboard
