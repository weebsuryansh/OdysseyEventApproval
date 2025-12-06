import { useState } from 'react'
import Banner from '../Banner/Banner'
import { api } from '../../services/api'
import './LoginPane.scss'

function LoginPane({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
    <div className="panel auth-card card-surface">
      <div className="panel-header">
        <div>
          <p className="muted">Welcome back</p>
          <h2>Sign in to continue</h2>
        </div>
        <div className="badge">Secure session</div>
      </div>
      <form onSubmit={submit} className="stack">
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" />
        </label>
        <label className="password-field">
          <span>Password</span>
          <div className="input-with-button">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <button type="button" className="ghost compact" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? '🙈 Hide' : '👁️ Show'}
            </button>
          </div>
        </label>
        {error && <Banner status={{ type: 'error', text: error }} />}
        <button type="submit">Sign in</button>
      </form>
      <p className="hint">
        Default accounts are created at startup with password set to &lt;username&gt;123. Examples: admin/admin123, dev/dev123,
        student/student123, sa/sa123, faculty/faculty123, dean/dean123.
      </p>
    </div>
  )
}

export default LoginPane
