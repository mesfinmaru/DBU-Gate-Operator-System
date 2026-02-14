import React, { useState } from 'react'
import { login } from '../services/api'
import { useNavigate } from 'react-router-dom'

export default function Login({ onLoggedIn }) {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await login(username, password)
      localStorage.setItem('access_token', res.access_token)
      onLoggedIn(res.user)
      if (res.user?.role === 'admin') navigate('/admin')
      else navigate('/gate')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="dbu-login">
      <div className="dbu-login-card">
        <div className="dbu-login-brand">Debre Berhan University</div>
        <h2>Sign In</h2>
      <form onSubmit={submit}>
        <div style={{ marginBottom: 12 }}>
          <label>Username</label>
            <input className="dbu-input" value={username} onChange={e => setUsername(e.target.value)} />
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>Password</label>
            <input className="dbu-input" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
        <div className="alert alert-info small mb-3">
          <strong>Demo Credentials:</strong><br/>
          Admin: <code>admin</code> / <code>admin123</code><br/>
          Operator: <code>operator</code> / <code>operator123</code>
        </div>
          <button className="dbu-btn" disabled={loading}>{loading ? 'Logging in...' : 'Login'}</button>
      </form>
      </div>
    </div>
  )
}
