import { useState } from 'react'
import Banner from '../Banner/Banner'
import { api } from '../../services/api'
import './ChangePasswordCard.scss'

function ChangePasswordCard() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState({ type: '', text: '' })

  const submit = async (e) => {
    e.preventDefault()
    setStatus({ type: '', text: '' })
    if (newPassword !== confirm) {
      setStatus({ type: 'error', text: 'New passwords do not match' })
      return
    }
    try {
      await api('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      setStatus({ type: 'success', text: 'Password updated. Use the new password next time you sign in.' })
      setCurrentPassword('')
      setNewPassword('')
      setConfirm('')
    } catch (err) {
      setStatus({ type: 'error', text: 'Could not update password. Double-check your current password and try again.' })
    }
  }

  return (
    <div className="panel card-surface">
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
        <Banner status={status} />
        <button type="submit">Update password</button>
      </form>
    </div>
  )
}

export default ChangePasswordCard
