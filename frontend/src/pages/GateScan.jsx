import React, { useEffect, useRef, useState } from 'react'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { scanStudent, scanAsset } from '../services/api'

export default function GateScan({ user }) {
  const [mode, setMode] = useState('camera')
  const [phase, setPhase] = useState('student')
  const [studentId, setStudentId] = useState('')
  const [exitToken, setExitToken] = useState('')
  const [status, setStatus] = useState('')
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const [cameraActive, setCameraActive] = useState(false)
  const qrRefStudent = useRef(null)
  const qrRefAsset = useRef(null)
  const html5 = useRef(null)
  const usbBuffer = useRef('')
  const lastKeyTime = useRef(0)

  useEffect(() => {
    if (mode === 'camera') autoStartStudentCamera()
    return () => { stopCamera() }
  }, [])

  useEffect(() => {
    if (mode === 'usb') {
      const onKey = (e) => {
        const now = Date.now()
        if (now - lastKeyTime.current > 100) usbBuffer.current = ''
        lastKeyTime.current = now
        if (e.key === 'Enter') {
          const code = usbBuffer.current.trim()
          usbBuffer.current = ''
          if (!code) return
          if (phase === 'student') handleScanStudent(code)
          else handleScanAsset(code)
        } else if (e.key.length === 1) {
          usbBuffer.current += e.key
        }
      }
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
  }, [mode, phase])

  const startCamera = async (onScan, targetRef, formatsToSupport) => {
    setError('')
    try {
      const id = `qr-${targetRef === qrRefStudent ? 'student' : 'asset'}`
      targetRef.current.innerHTML = ''
      const el = document.createElement('div')
      el.id = id
      targetRef.current.appendChild(el)
      html5.current = new Html5Qrcode(id)
      setCameraActive(true)
      await html5.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250, formatsToSupport },
        decodedText => {
          onScan(decodedText)
          stopCamera()
        },
        () => {}
      )
    } catch (e) {
      setError('Camera error')
      setCameraActive(false)
    }
  }

  const autoStartStudentCamera = () => {
    setPhase('student')
    startCamera(handleScanStudent, qrRefStudent, [
      Html5QrcodeSupportedFormats.CODE_128,
      Html5QrcodeSupportedFormats.EAN_13,
      Html5QrcodeSupportedFormats.QR_CODE
    ])
  }

  const stopCamera = async () => {
    try {
      if (html5.current && cameraActive) {
        await html5.current.stop()
        await html5.current.clear()
      }
    } catch {}
    setCameraActive(false)
  }

  const handleScanStudent = async (code) => {
    setError('')
    try {
      const sid = code.trim()
      setStudentId(sid)
      const res = await scanStudent(sid)
      setStatus('Student OK')
      setExitToken(res.exit_token)
      setResult({ student: res.student, has_assets: res.has_assets, asset_count: res.asset_count })
      setPhase('asset')
      if (mode === 'camera') {
        stopCamera()
        startCamera(handleScanAsset, qrRefAsset, [Html5QrcodeSupportedFormats.QR_CODE])
      }
    } catch (err) {
      setStatus('BLOCKED')
      setError(err.response?.data?.reason || err.response?.data?.error || 'Scan failed')
    }
  }

  const handleScanAsset = async (qr) => {
    setError('')
    try {
      const res = await scanAsset(studentId, qr, exitToken)
      setStatus('ALLOWED')
      setResult({ student: res.student, asset: res.asset })
    } catch (err) {
      setStatus('BLOCKED')
      setError(err.response?.data?.reason || err.response?.data?.error || 'Asset validation failed')
    }
  }

  return (
    <div className="dbu-container">
      <div className="dbu-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Gate Operator</h2>
          <div className="dbu-pill">
            <i className="bi bi-person-circle me-2"></i>
            {user?.username} ({user?.role})
          </div>
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Scan Mode</label>
          <select 
            className="dbu-input" 
            value={mode} 
            onChange={e => { stopCamera(); setMode(e.target.value); if (e.target.value === 'camera') autoStartStudentCamera() }}
            style={{ maxWidth: 300 }}
          >
            <option value="camera">Camera</option>
            <option value="usb">USB Scanner</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="dbu-card" style={{ background: '#082832', border: '1px solid var(--panel-border)' }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--panel-border)', paddingBottom: 10 }}>
              1. Student ID
            </h3>
            {mode === 'camera' ? (
              <>
                <div ref={qrRefStudent} style={{ minHeight: 300, background: '#000', borderRadius: 8, overflow: 'hidden' }} />
                {!cameraActive
                  ? <button className="dbu-btn" onClick={() => startCamera(
                      handleScanStudent,
                      qrRefStudent,
                      [
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.QR_CODE
                      ]
                    )} style={{ marginTop: 12, width: '100%' }}>
                      <i className="bi bi-camera-video me-2"></i> Start Camera
                    </button>
                  : <button className="dbu-btn" onClick={stopCamera} style={{ marginTop: 12, width: '100%', background: 'var(--dbu-red)', borderColor: 'var(--dbu-red)', color: 'white' }}>
                      <i className="bi bi-stop-circle me-2"></i> Stop Camera
                    </button>}
              </>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--dbu-muted)' }}>
                <i className="bi bi-upc-scan" style={{ fontSize: 48, display: 'block', marginBottom: 10 }}></i>
                Scan student barcode with USB scanner
              </div>
            )}
          </div>

          <div className="dbu-card" style={{ background: '#082832', border: '1px solid var(--panel-border)', opacity: phase === 'student' ? 0.5 : 1 }}>
            <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--panel-border)', paddingBottom: 10 }}>
              2. Asset QR
            </h3>
            {mode === 'camera' ? (
              <>
                <div ref={qrRefAsset} style={{ minHeight: 300, background: '#000', borderRadius: 8, overflow: 'hidden' }} />
                {!cameraActive
                  ? <button className="dbu-btn" onClick={() => startCamera(
                      handleScanAsset,
                      qrRefAsset,
                      [Html5QrcodeSupportedFormats.QR_CODE]
                    )} style={{ marginTop: 12, width: '100%' }} disabled={phase === 'student'}>
                      <i className="bi bi-qr-code-scan me-2"></i> Start Camera
                    </button>
                  : <button className="dbu-btn" onClick={stopCamera} style={{ marginTop: 12, width: '100%', background: 'var(--dbu-red)', borderColor: 'var(--dbu-red)', color: 'white' }}>
                      <i className="bi bi-stop-circle me-2"></i> Stop Camera
                    </button>}
              </>
            ) : (
              <div style={{ padding: 40, textAlign: 'center', color: 'var(--dbu-muted)' }}>
                <i className="bi bi-qr-code" style={{ fontSize: 48, display: 'block', marginBottom: 10 }}></i>
                Scan asset QR with USB scanner
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: 20 }}>
          {status && <div className={`dbu-banner ${status === 'ALLOWED' || status === 'Student OK' ? 'ok' : 'bad'}`}>
            <i className={`bi ${status === 'ALLOWED' || status === 'Student OK' ? 'bi-check-circle' : 'bi-x-circle'} me-2`}></i>
            {status}
          </div>}
          
          {error && <div className="dbu-banner bad">
            <i className="bi bi-exclamation-triangle me-2"></i>
            {error}
          </div>}

          {result && (
            <div style={{ marginTop: 20 }}>
              <div className="dbu-owner">
                <div className="dbu-owner-left">
                  <div className="dbu-avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
                    {(result.student?.full_name || result.student?.student_id || 'U').split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase()}
                  </div>
                  <div>
                    <div className="dbu-owner-name" style={{ fontSize: 20 }}>{result.student?.full_name || result.student?.student_id}</div>
                    <div className="dbu-owner-id">{result.student?.student_id}</div>
                    {result.student?.department && <div className="small text-muted">{result.student.department} - {result.student.year}</div>}
                  </div>
                </div>
                <div className="dbu-owner-right">
                  {'has_assets' in result && (
                    <div className={`dbu-pill ${result.asset_count > 0 ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                      Assets: {result.asset_count}
                    </div>
                  )}
                  {result.student?.status && (
                    <div className={`dbu-pill ${result.student.status === 'active' ? 'bg-success' : 'bg-danger'}`}>
                      {result.student.status.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              
              {result.asset && (
                <div className="dbu-card" style={{ marginTop: 16, borderLeft: '4px solid var(--dbu-primary)' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: 'var(--dbu-primary)' }}>Asset Details</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16 }}>
                    <div>
                      <div className="text-muted small">Asset ID</div>
                      <div style={{ fontWeight: 600 }}>#{result.asset.asset_id}</div>
                    </div>
                    <div>
                      <div className="text-muted small">Brand</div>
                      <div style={{ fontWeight: 600 }}>{result.asset.brand}</div>
                    </div>
                    <div>
                      <div className="text-muted small">Serial Number</div>
                      <div style={{ fontWeight: 600 }}>{result.asset.serial_number}</div>
                    </div>
                    <div>
                      <div className="text-muted small">Color</div>
                      <div style={{ fontWeight: 600 }}>{result.asset.color}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
