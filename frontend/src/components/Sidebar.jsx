import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Sidebar({ user }) {
  const [collapsed, setCollapsed] = useState(false)
  const { pathname } = useLocation()
  const Item = ({ to, label }) => (
    <Link
      to={to}
      className={`dbu-side-item ${pathname === to ? 'active' : ''}`}
    >
      {label}
    </Link>
  )
  return (
    <aside className={`dbu-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="dbu-side-header">
        <span>Menu</span>
        <button className="dbu-side-toggle" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? '▶' : '◀'}
        </button>
      </div>
      <nav className="dbu-side-nav">
        <Item to="/" label="Home" />
        <Item to="/gate" label="Gate" />
        {user?.role === 'admin' && <Item to="/admin" label="Admin" />}
      </nav>
    </aside>
  )
}
