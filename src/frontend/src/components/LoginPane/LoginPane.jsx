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
      setError(err.message || 'Login failed')
    }
  }

  return (
    <div className="login-card">
      <div className="login-card__header">
        <h2>Events Portal</h2>
        <p>Login to continue</p>
      </div>
      <form onSubmit={submit} className="login-form">
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Enter your username" />
        </label>
        <label className="password-field">
          Password
          <div className="password-row">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <button type="button" className="ghost compact toggle-password" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </label>
        {error && <Banner status={{ type: 'error', text: error }} />}
        <button type="submit" className="login-submit">
          Login
        </button>
      </form>
      <p className="hint">
        Default accounts are created at startup with password set to &lt;username&gt;123. Examples: admin/admin123, dev/dev123,
        student/student123, sa/sa123, faculty/faculty123, dean/dean123.
      </p>
    </div>
  )
}

export default LoginPane
