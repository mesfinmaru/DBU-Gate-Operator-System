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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
          <div className="dbu-pill">
            <i className="bi bi-shield-lock me-2"></i>
            Administrator
          </div>
        </div>

        {message && <div className="dbu-banner ok"><i className="bi bi-check-circle me-2"></i>{message}</div>}
        {error && <div className="dbu-banner bad"><i className="bi bi-exclamation-triangle me-2"></i>{error}</div>}
        
        {existingAsset && (
          <div className="dbu-card" style={{ background: '#2a0e10', borderColor: '#b71c1c', marginBottom: 16 }}>
            <h4 style={{ color: '#d94848', marginTop: 0 }}><i className="bi bi-exclamation-circle me-2"></i>Asset Conflict Detected</h4>
            <p>Serial <strong>{existingAsset.serial_number}</strong> is already owned by <strong>{existingAsset.owner_student_id}</strong>.</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="dbu-btn" onClick={handleOverride} style={{ background: '#d94848', color: 'white', borderColor: '#b71c1c' }}>
                <i className="bi bi-arrow-repeat me-2"></i>Override & Reassign
              </button>
              <button className="dbu-btn" onClick={() => { setExistingAsset(null); setError(''); }} style={{ background: 'transparent' }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="dbu-card" style={{ background: '#082832', border: '1px solid var(--panel-border)', marginBottom: 20 }}>
          <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--panel-border)', paddingBottom: 10 }}>
            <i className="bi bi-plus-circle me-2"></i>Register New Asset
          </h3>
          <form onSubmit={submit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Owner Student ID</label>
              <input className="dbu-input" value={form.owner_student_id} onChange={e => setForm(f => ({ ...f, owner_student_id: e.target.value }))} placeholder="e.g. STU-1001" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Serial Number</label>
              <input className="dbu-input" value={form.serial_number} onChange={e => setForm(f => ({ ...f, serial_number: e.target.value }))} placeholder="e.g. SN-DELL-001" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Brand</label>
              <input className="dbu-input" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} placeholder="e.g. Dell" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Color</label>
              <input className="dbu-input" value={form.color} onChange={e => setForm(f => ({ ...f, color: e.target.value }))} placeholder="e.g. Black" />
            </div>
            <div style={{ gridColumn: '1 / span 2' }}>
              <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Visible Specs</label>
              <textarea className="dbu-input" rows={3} value={form.visible_specs} onChange={e => setForm(f => ({ ...f, visible_specs: e.target.value }))} placeholder="Describe visible marks, scratches, etc." />
            </div>
            <div style={{ gridColumn: '1 / span 2' }}>
              <button className="dbu-btn" disabled={loading} style={{ width: '100%' }}>
                {loading ? 'Registering...' : <><i className="bi bi-save me-2"></i>Register Asset</>}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="dbu-container" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, padding: 0, marginTop: 20 }}>
        <div className="dbu-card">
          <h3 style={{ marginTop: 0, marginBottom: 16 }}><i className="bi bi-graph-up me-2"></i>Statistics</h3>
          {stats ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="dbu-card" style={{ padding: 12, textAlign: 'center' }}>
                <div className="text-muted small">Total Students</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.total_students}</div>
              </div>
              <div className="dbu-card" style={{ padding: 12, textAlign: 'center', borderColor: 'var(--neon)' }}>
                <div className="text-muted small" style={{ color: 'var(--neon)' }}>Active Students</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--neon)' }}>{stats.active_students}</div>
              </div>
              <div className="dbu-card" style={{ padding: 12, textAlign: 'center' }}>
                <div className="text-muted small">Total Assets</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.total_assets}</div>
              </div>
              <div className="dbu-card" style={{ padding: 12, textAlign: 'center', borderColor: 'var(--neon)' }}>
                <div className="text-muted small" style={{ color: 'var(--neon)' }}>Active Assets</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--neon)' }}>{stats.active_assets}</div>
              </div>
              <div className="dbu-card" style={{ padding: 12, textAlign: 'center', gridColumn: '1 / span 2' }}>
                <div className="text-muted small">Total Exits</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{stats.total_exits}</div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 5, fontSize: 12 }}>
                  <span className="text-success">Allowed: {stats.allowed_exits}</span>
                  <span className="text-danger">Blocked: {stats.blocked_exits}</span>
                </div>
              </div>
            </div>
          ) : <div className="dbu-muted">Loading...</div>}
        </div>

        <div className="dbu-card">
          <h3 style={{ marginTop: 0, marginBottom: 16 }}><i className="bi bi-people me-2"></i>Students</h3>
          <div className="dbu-table">
            <div className="dbu-thead" style={{ gridTemplateColumns: '80px 1fr 80px 80px' }}>
              <div>ID</div><div>Name</div><div>Status</div><div>Action</div>
            </div>
            <div className="dbu-tbody" style={{ maxHeight: 300, overflowY: 'auto' }}>
              {students.map(s => (
                <div key={s.student_id} className="dbu-row" style={{ gridTemplateColumns: '80px 1fr 80px 80px', alignItems: 'center', fontSize: 13 }}>
                  <div style={{ fontWeight: 600 }}>{s.student_id}</div>
                  <div>{s.full_name}</div>
                  <div>
                    <span className={`badge ${s.status === 'active' ? 'bg-success' : 'bg-danger'}`} style={{ padding: '2px 6px', fontSize: 10 }}>
                      {s.status}
                    </span>
                  </div>
                  <div>
                    {s.status === 'active'
                      ? <button className="dbu-btn" style={{ padding: '2px 8px', fontSize: 11, background: 'var(--dbu-red)', borderColor: 'var(--dbu-red)' }} onClick={async () => { await adminStudentStatus(s.student_id, 'blocked'); loadAll() }}>Block</button>
                      : <button className="dbu-btn" style={{ padding: '2px 8px', fontSize: 11, background: 'var(--dbu-green)', borderColor: 'var(--dbu-green)' }} onClick={async () => { await adminStudentStatus(s.student_id, 'active'); loadAll() }}>Activate</button>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dbu-card" style={{ gridColumn: '1 / span 2' }}>
          <h3 style={{ marginTop: 0, marginBottom: 16 }}><i className="bi bi-pc-display me-2"></i>Assets</h3>
          <div className="dbu-table">
            <div className="dbu-thead" style={{ gridTemplateColumns: '60px 100px 120px 100px 80px 80px 1fr' }}>
              <div>ID</div><div>Owner</div><div>Serial</div><div>Brand</div><div>Color</div><div>Status</div><div>Actions</div>
            </div>
            <div className="dbu-tbody">
              {assets.map(a => (
                <div key={a.asset_id} className="dbu-row" style={{ gridTemplateColumns: '60px 100px 120px 100px 80px 80px 1fr', alignItems: 'center', fontSize: 13 }}>
                  <div>{a.asset_id}</div>
                  <div style={{ fontWeight: 600 }}>{a.owner_student_id}</div>
                  <div style={{ fontFamily: 'monospace' }}>{a.serial_number}</div>
                  <div>{a.brand}</div>
                  <div>{a.color}</div>
                  <div>
                    <span className={`badge ${a.status === 'active' ? 'bg-success' : 'bg-warning'}`} style={{ padding: '2px 6px', fontSize: 10 }}>
                      {a.status}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="dbu-btn" style={{ padding: '4px 8px', fontSize: 11 }} onClick={() => setQrAsset(a)} title="Show QR"><i className="bi bi-qr-code"></i></button>
                    <button className="dbu-btn" style={{ padding: '4px 8px', fontSize: 11, background: 'var(--dbu-red)', borderColor: 'var(--dbu-red)' }} onClick={async () => { await adminAssetStatus(a.asset_id, 'revoked'); loadAll() }} title="Revoke"><i className="bi bi-x-circle"></i></button>
                    <button className="dbu-btn" style={{ padding: '4px 8px', fontSize: 11, background: '#ff9800', borderColor: '#ff9800', color: 'black' }} onClick={async () => { await adminAssetStatus(a.asset_id, 'stolen'); loadAll() }} title="Mark Stolen"><i className="bi bi-exclamation-diamond"></i></button>
                    <button className="dbu-btn" style={{ padding: '4px 8px', fontSize: 11, background: 'var(--dbu-green)', borderColor: 'var(--dbu-green)' }} onClick={async () => { await adminAssetStatus(a.asset_id, 'active'); loadAll() }} title="Activate"><i className="bi bi-check-circle"></i></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {qrAsset && (
            <div className="dbu-card" style={{ marginTop: 20, textAlign: 'center', border: '2px dashed var(--dbu-primary)' }}>
              <h4 style={{ color: 'var(--dbu-primary)' }}><i className="bi bi-qr-code me-2"></i>Asset QR Code</h4>
              <div style={{ background:'#fff', padding:20, display:'inline-block', borderRadius:12 }}>
                <QRCode value={qrAsset.qr_signature || ''} size={200} />
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'center' }}>
                <button className="dbu-btn" onClick={() => handlePrintQR(qrAsset)}><i className="bi bi-printer me-2"></i>Print Sticker</button>
                <button className="dbu-btn" onClick={() => setQrAsset(null)} style={{ background: 'transparent' }}>Close</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
