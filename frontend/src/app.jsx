import React, { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom'
import Login from './pages/Login.jsx'
import GateScan from './pages/GateScan.jsx'
import Sidebar from './components/Sidebar.jsx'
import logo from './components/dbu-logo.png'
import Admin from './pages/Admin.jsx'
import ExitLogs from './pages/ExitLogs.jsx'
import { jwtDecode } from 'jwt-decode'

export default function App() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)
  const [user, setUser] = useState(null)

  useEffect(() => {
    const useMock = import.meta.env.VITE_USE_MOCK === 'true'
    if (useMock) {
      setHealth({ service: 'EACS API', status: 'ok', mock: true })
      return
    }
    const api = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`
    fetch(`${api}/api/health`)
      .then(res => res.json())
      .then(setHealth)
      .catch(() => setError('Backend unreachable'))
  }, [])

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (token) {
      try {
        const payload = jwtDecode(token)
        setUser({ username: payload.sub || 'user', role: payload.role || 'gate_operator' })
      } catch {}
    }
  }, [])

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  return (
    <BrowserRouter>
      <header className="dbu-header">
        <div className="dbu-brand">
          <img src={logo} alt="DBU" style={{ height: 64, width: 'auto' }} />
          <span>Debre Berhan University – Gate Operators System</span>
        </div>
        <nav className="dbu-nav">
          {!user && <Link to="/login">Login</Link>}
          {user && <>
            <Link to="/">Home</Link>
            <Link to="/gate">Gate</Link>
            <Link to="/logs">Logs</Link>
            {user.role === 'admin' && <Link to="/admin">Admin</Link>}
            <button className="dbu-btn" onClick={logout}>Logout</button>
          </>}
        </nav>
      </header>
      {user ? (
        <div className="dbu-layout">
          <Sidebar user={user} />
          <div className="dbu-container">
            <Routes>
              <Route path="/" element={
                <div className="dbu-card">
                  <h2>Welcome</h2>
                  <div className={`dbu-banner ${health ? 'ok' : (error ? 'bad' : '')}`}>
                    {health ? (health.mock ? 'Backend: MOCK' : 'Backend: HEALTHY') : (error ? `Backend: ${error.toUpperCase()}` : 'Checking backend...')}
                  </div>
                  <div style={{ marginTop: 16 }}>
                    <a className="dbu-btn" href={(import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/`)} target="_blank" rel="noreferrer">Open Backend API</a>
                  </div>
                </div>
              } />
              <Route path="/gate" element={<GateScan user={user} />} />
              <Route path="/logs" element={<ExitLogs />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>
      ) : (
        <div className="dbu-container">
          <Routes>
            <Route path="/login" element={<Login onLoggedIn={setUser} />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </div>
      )}
    </BrowserRouter>
  )
}
