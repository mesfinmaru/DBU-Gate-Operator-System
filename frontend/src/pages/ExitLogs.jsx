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
        <h2>Exit Logs</h2>
        {error && <div className="dbu-banner bad">{error}</div>}
        <div style={{ marginBottom: 12 }}>
          <label>Limit</label>{' '}
          <input className="dbu-input" type="number" value={limit} onChange={e => setLimit(parseInt(e.target.value || '50', 10))} />
        </div>
        <div className="dbu-table">
          <div className="dbu-thead" style={{ gridTemplateColumns: '140px 120px 100px 100px 100px 1fr' }}>
            <div>Timestamp</div>
            <div>Student</div>
            <div>Asset</div>
            <div>Operator</div>
            <div>Result</div>
            <div>Reason</div>
          </div>
          <div className="dbu-tbody">
            {logs.map(l => (
              <div key={l.log_id} className="dbu-row" style={{ gridTemplateColumns: '140px 120px 100px 100px 100px 1fr' }}>
                <div>{new Date(l.timestamp).toLocaleString()}</div>
                <div>{l.student_id}</div>
                <div>{l.asset_id ?? '-'}</div>
                <div>{l.operator_id}</div>
                <div className={l.result === 'ALLOWED' ? 'dbu-status-ok' : 'dbu-status-bad'}>{l.result}</div>
                <div>{l.reason}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
