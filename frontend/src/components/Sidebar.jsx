import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Sidebar({ user }) {
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()
  const Item = ({ to, label, icon }) => (
    <Link
      to={to}
      className={`dbu-side-item ${pathname === to ? 'active' : ''}`}
      style={{ display: 'flex', alignItems: 'center', gap: 10 }}
    >
      <i className={`bi ${icon}`}></i>
      {!collapsed && <span>{label}</span>}
    </Link>
  )
  return (
    <aside className={`dbu-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="dbu-side-header">
        {!collapsed && <span style={{ fontWeight: 800, color: 'var(--dbu-primary)' }}>MENU</span>}
        <button className="dbu-side-toggle" onClick={() => setCollapsed(!collapsed)}>
          <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
        </button>
      </div>
      <nav className="dbu-side-nav">
        <Item to="/" label="Dashboard" icon="bi-speedometer2" />
        <Item to="/gate" label="Gate Scan" icon="bi-qr-code-scan" />
        <Item to="/logs" label="Exit Logs" icon="bi-clock-history" />
        {user?.role === 'admin' && <Item to="/admin" label="Admin Portal" icon="bi-shield-lock" />}
      </nav>
    </aside>
  )
}
