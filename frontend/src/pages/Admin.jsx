import React, { useEffect, useState } from 'react'
import { adminRegisterAsset, adminAssets, adminStudents, adminStatistics, adminAssetStatus, adminStudentStatus, adminUpdateAsset } from '../services/api'
import QRCode from 'react-qr-code'

export default function Admin() {
  const [form, setForm] = useState({
    owner_student_id: '',
    serial_number: '',
    brand: '',
    color: '',
    visible_specs: ''
  })
  const [stats, setStats] = useState(null)
  const [assets, setAssets] = useState([])
  const [students, setStudents] = useState([])
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [qrAsset, setQrAsset] = useState(null)
  const [existingAsset, setExistingAsset] = useState(null)

  const loadAll = async () => {
    try {
      const [s, a, st] = await Promise.all([adminStatistics(), adminAssets(), adminStudents()])
      setStats(s)
      setAssets(a)
      setStudents(st)
    } catch {
      setError('Failed to load admin data')
    }
  }

  useEffect(() => { loadAll() }, [])

  const handlePrintQR = (assetData) => {
    const data = assetData || qrAsset
    if (!data) return
    const qrValue = data.qr_signature || ''
    
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <html>
        <head>
          <title>DBU Asset QR - ${data.serial_number}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; text-align: center; }
            .ticket { 
              border: 2px dashed #333; 
              padding: 20px; 
              max-width: 300px; 
              margin: 0 auto; 
              border-radius: 10px;
            }
            .header { font-weight: bold; font-size: 18px; margin-bottom: 15px; text-transform: uppercase; }
            .qr-container { margin: 20px auto; }
            .info { margin-top: 15px; text-align: left; font-size: 14px; }
            .info p { margin: 5px 0; border-bottom: 1px solid #eee; padding-bottom: 3px; }
            .footer { margin-top: 20px; font-size: 10px; color: #666; }
          </style>
        </head>
        <body>
          <div className="ticket">
            <div className="header">DBU Gate Pass System</div>
            <div className="qr-container">
              <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrValue)}" alt="QR Code" />
            </div>
            <div className="info">
              <p><strong>S/N:</strong> ${data.serial_number}</p>
              <p><strong>Brand:</strong> ${data.brand || 'N/A'}</p>
              <p><strong>Student:</strong> ${data.owner_student_id}</p>
              <p><strong>Reg Date:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            <div className="footer">
              Property of Debre Berhan University<br/>
              Scan to verify exit
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')
    setExistingAsset(null)
    try {
      const res = await adminRegisterAsset(form)
      
      if (res.status === 'CONFLICT') {
        setExistingAsset(res.existing_asset)
        setError('Asset with this serial number already exists!')
        setLoading(false)
        return
      }

      setMessage('Asset registered successfully')
      setForm({ owner_student_id: '', serial_number: '', brand: '', color: '', visible_specs: '' })
      setQrAsset(res.asset)
      await loadAll()
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  const handleOverride = async () => {
    if (!existingAsset) return
    if (!window.confirm('Override and reassign this asset to the new student?')) return
    
    try {
      await adminUpdateAsset(existingAsset.asset_id, {
        owner_student_id: form.owner_student_id,
        status: 'active'
      })
      setMessage('Asset ownership updated successfully!')
      setExistingAsset(null)
      setError('')
      setForm({ owner_student_id: '', serial_number: '', brand: '', color: '', visible_specs: '' })
      await loadAll()
    } catch (err) {
      setError('Failed to update asset')
    }
  }

  return (
    <div className="dbu-container">
      <div className="dbu-card">
        <h2>Admin Dashboard</h2>
        {message && <div className="dbu-banner ok">{message}</div>}
        {error && <div className="dbu-banner bad">{error}</div>}
        
        {existingAsset && (
          <div className="dbu-card" style={{ background: '#2a0e10', borderColor: '#b71c1c', marginBottom: 16 }}>
            <h4 style={{ color: '#d94848', marginTop: 0 }}>Asset Conflict Detected</h4>
            <p>Serial <strong>{existingAsset.serial_number}</strong> is already owned by <strong>{existingAsset.owner_student_id}</strong>.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="dbu-btn" onClick={handleOverride} style={{ background: '#d94848', color: 'white', borderColor: '#b71c1c' }}>Override & Reassign</button>
              <button className="dbu-btn" onClick={() => { setExistingAsset(null); setError(''); }} style={{ background: 'transparent' }}>Cancel</button>
            </div>
          </div>
        )}

        <h3 style={{ marginTop: 8 }}>Register New Asset</h3>
        <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label>Owner Student ID</label>
            <input className="dbu-input" value={form.owner_student_id} onChange={e => setForm(f => ({ ...f, owner_student_id: e.target.value }))} />
          </div>
          <div>
            <label>Serial Number</label>
            <input className="dbu-input" value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} />
          </div>
          <div>
            <label>Brand</label>
            <input className="dbu-input" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
          </div>
          <div>
            <label>Color</label>
            <input className="dbu-input" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} />
          </div>
          <div style={{ gridColumn: '1 / span 2' }}>
            <label>Visible Specs</label>
            <textarea className="dbu-input" rows={3} value={form.visible_specs} onChange={e => setForm(f => ({ ...f, visible_specs: e.target.value }))} />
          </div>
          <div style={{ gridColumn: '1 / span 2' }}>
            <button className="dbu-btn" disabled={loading}>{loading ? 'Registering...' : 'Register Asset'}</button>
          </div>
        </form>
      </div>

      <div className="dbu-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="dbu-card">
          <h3>Statistics</h3>
          {stats ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div className="dbu-card"><strong>Total Students:</strong> {stats.total_students}</div>
              <div className="dbu-card"><strong>Active Students:</strong> {stats.active_students}</div>
              <div className="dbu-card"><strong>Total Assets:</strong> {stats.total_assets}</div>
              <div className="dbu-card"><strong>Active Assets:</strong> {stats.active_assets}</div>
              <div className="dbu-card"><strong>Total Exits:</strong> {stats.total_exits}</div>
              <div className="dbu-card"><strong>Allowed Exits:</strong> {stats.allowed_exits}</div>
              <div className="dbu-card"><strong>Blocked Exits:</strong> {stats.blocked_exits}</div>
            </div>
          ) : <div className="dbu-muted">Loading...</div>}
        </div>

        <div className="dbu-card">
          <h3>Students</h3>
          <div className="dbu-table">
            <div className="dbu-thead">
              <div>ID</div><div>Name</div><div>Status</div><div>Actions</div>
            </div>
            <div className="dbu-tbody">
              {students.map(s => (
                <div key={s.student_id} className="dbu-row" style={{ gridTemplateColumns: '1fr 2fr 1fr 1fr' }}>
                  <div>{s.student_id}</div>
                  <div>{s.full_name}</div>
                  <div>{s.status}</div>
                  <div>
                    {s.status === 'active'
                      ? <button className="dbu-btn" onClick={async () => { await adminStudentStatus(s.student_id, 'blocked'); loadAll() }}>Block</button>
                      : <button className="dbu-btn" onClick={async () => { await adminStudentStatus(s.student_id, 'active'); loadAll() }}>Unblock</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dbu-card" style={{ gridColumn: '1 / span 2' }}>
          <h3>Assets</h3>
          <div className="dbu-table">
            <div className="dbu-thead">
              <div>ID</div><div>Owner</div><div>Serial</div><div>Brand</div><div>Color</div><div>Status</div><div>Actions</div>
            </div>
            <div className="dbu-tbody">
              {assets.map(a => (
                <div key={a.asset_id} className="dbu-row" style={{ gridTemplateColumns: '60px 120px 140px 120px 100px 100px 1fr' }}>
                  <div>{a.asset_id}</div>
                  <div>{a.owner_student_id}</div>
                  <div>{a.serial_number}</div>
                  <div>{a.brand}</div>
                  <div>{a.color}</div>
                  <div>{a.status}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button className="dbu-btn" onClick={() => setQrAsset(a)}>Show QR</button>
                    <button className="dbu-btn" onClick={async () => { await adminAssetStatus(a.asset_id, 'revoked'); loadAll() }}>Revoke</button>
                    <button className="dbu-btn" onClick={async () => { await adminAssetStatus(a.asset_id, 'stolen'); loadAll() }}>Mark Stolen</button>
                    <button className="dbu-btn" onClick={async () => { await adminAssetStatus(a.asset_id, 'active'); loadAll() }}>Activate</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {qrAsset && (
            <div className="dbu-card" style={{ marginTop: 12 }}>
              <h4>Asset QR</h4>
              <div style={{ background:'#fff', padding:12, display:'inline-block', borderRadius:12 }}>
                <QRCode value={qrAsset.qr_signature || ''} size={180} />
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
                <button className="dbu-btn" onClick={() => handlePrintQR(qrAsset)}>Print Sticker</button>
                <button className="dbu-btn" onClick={() => setQrAsset(null)}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
