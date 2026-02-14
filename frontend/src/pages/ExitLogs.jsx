import React, { useEffect, useState } from 'react'
import { exitLogs } from '../services/api'

export default function ExitLogs() {
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')
  const [limit, setLimit] = useState(50)

  const load = async () => {
    try {
      const data = await exitLogs(limit)
      setLogs(data)
      setError('')
    } catch {
      setError('Failed to load logs')
    }
  }

  useEffect(() => { load(); const t = setInterval(load, 5000); return () => clearInterval(t) }, [limit])

  return (
    <div className="dbu-container">
      <div className="dbu-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Exit Logs</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label>Limit:</label>
            <input 
              className="dbu-input" 
              type="number" 
              value={limit} 
              onChange={e => setLimit(parseInt(e.target.value || '50', 10))} 
              style={{ width: 80 }}
            />
            <button className="dbu-btn" onClick={() => load()}>
              <i className="bi bi-arrow-clockwise"></i>
            </button>
          </div>
        </div>

        {error && <div className="dbu-banner bad">{error}</div>}

        <div className="dbu-table">
          <div className="dbu-thead" style={{ gridTemplateColumns: '180px 1fr 100px 100px 100px 1fr' }}>
            <div>Timestamp</div>
            <div>Student</div>
            <div>Asset ID</div>
            <div>Operator</div>
            <div>Result</div>
            <div>Reason</div>
          </div>
          <div className="dbu-tbody">
            {logs.length === 0 ? (
              <div className="dbu-row" style={{ gridTemplateColumns: '1fr', padding: 20, textAlign: 'center', color: 'var(--dbu-muted)' }}>
                No logs found
              </div>
            ) : (
              logs.map(l => (
                <div key={l.log_id} className="dbu-row" style={{ gridTemplateColumns: '180px 1fr 100px 100px 100px 1fr', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, color: 'var(--dbu-muted)' }}>{new Date(l.timestamp).toLocaleString()}</div>
                  <div style={{ fontWeight: 600 }}>{l.student_id}</div>
                  <div style={{ fontFamily: 'monospace' }}>{l.asset_id ?? '-'}</div>
                  <div>{l.operator_id || 'System'}</div>
                  <div>
                    <span className={`badge ${l.result === 'ALLOWED' ? 'bg-success' : 'bg-danger'}`}>
                      {l.result}
                    </span>
                  </div>
                  <div style={{ fontSize: 14 }}>{l.reason}</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
