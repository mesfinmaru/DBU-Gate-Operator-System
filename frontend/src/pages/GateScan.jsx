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
      // Use the actual status returned from the backend/mock
      setStatus(res.status)
      setResult({ student: res.student, asset: res.asset })
      setPhase('complete')
      stopCamera()
    } catch (err) {
      setStatus('BLOCKED')
      setError(err.response?.data?.reason || err.response?.data?.error || 'Asset validation failed')
    }
  }

  const resetScan = () => {
    setPhase('student')
    setStudentId('')
    setExitToken('')
    setStatus('')
    setResult(null)
    setError('')
    setMode('camera')
    autoStartStudentCamera()
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

        {phase === 'complete' ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
             <div style={{ fontSize: 64, color: status === 'ALLOWED' ? 'var(--dbu-green)' : 'var(--dbu-red)', marginBottom: 20 }}>
               <i className={`bi ${status === 'ALLOWED' ? 'bi-check-circle-fill' : 'bi-x-circle-fill'}`}></i>
             </div>
             <h1 style={{ color: status === 'ALLOWED' ? 'var(--dbu-green)' : 'var(--dbu-red)' }}>{status}</h1>
             
             {result && (
              <div style={{ margin: '30px auto', maxWidth: 500, textAlign: 'left' }}>
                <div className="dbu-owner" style={{ marginBottom: 20 }}>
                  <div className="dbu-owner-left">
                     <div className="dbu-avatar" style={{ width: 64, height: 64, fontSize: 24 }}>
                      {(result.student?.full_name || result.student?.student_id || 'U').split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <div className="dbu-owner-name">{result.student?.full_name || result.student?.student_id}</div>
                      <div className="dbu-owner-id">{result.student?.student_id}</div>
                    </div>
                  </div>
                </div>
                {result.asset && (
                  <div className="dbu-card" style={{ borderLeft: `4px solid ${status === 'ALLOWED' ? 'var(--dbu-green)' : 'var(--dbu-red)'}` }}>
                    <strong>Asset:</strong> {result.asset.brand} - {result.asset.serial_number}
                  </div>
                )}
              </div>
             )}

             <button className="dbu-btn" style={{ fontSize: 18, padding: '12px 32px' }} onClick={resetScan}>
               <i className="bi bi-arrow-repeat me-2"></i> Scan Next Student
             </button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Scan Mode</label>
              <select 
                className="dbu-input" 
                value={mode} 
                onChange={e => { stopCamera(); setMode(e.target.value); if (e.target.value === 'camera' && phase === 'student') autoStartStudentCamera() }}
                style={{ maxWidth: 300 }}
              >
                <option value="camera">Camera</option>
                <option value="usb">USB Scanner</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              {/* Step 1: Student Scan */}
              <div className="dbu-card" style={{ background: '#082832', border: phase === 'student' ? '2px solid var(--dbu-primary)' : '1px solid var(--panel-border)', opacity: phase === 'student' ? 1 : 0.5 }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--panel-border)', paddingBottom: 10 }}>
                  1. Student ID
                  {phase !== 'student' && <i className="bi bi-check-circle-fill text-success ms-2"></i>}
                </h3>
                
                {phase === 'student' && (
                  mode === 'camera' ? (
                    <>
                      <div ref={qrRefStudent} style={{ minHeight: 300, background: '#000', borderRadius: 8, overflow: 'hidden' }} />
                      {!cameraActive && <button className="dbu-btn" onClick={autoStartStudentCamera} style={{ marginTop: 12, width: '100%' }}>Activate Camera</button>}
                    </>
                  ) : (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--dbu-muted)' }}>
                      <i className="bi bi-upc-scan" style={{ fontSize: 48, display: 'block', marginBottom: 10 }}></i>
                      Scan student barcode
                    </div>
                  )
                )}
                
                {phase !== 'student' && result?.student && (
                   <div style={{ padding: 20 }}>
                     <div style={{ fontWeight: 800, fontSize: 18 }}>{result.student.student_id}</div>
                     <div>{result.student.full_name}</div>
                     <div className={`badge ${result.student.status === 'active' ? 'bg-success' : 'bg-danger'}`}>{result.student.status}</div>
                   </div>
                )}
              </div>

              {/* Step 2: Asset Scan */}
              <div className="dbu-card" style={{ background: '#082832', border: phase === 'asset' ? '2px solid var(--dbu-primary)' : '1px solid var(--panel-border)', opacity: phase === 'asset' ? 1 : 0.5 }}>
                <h3 style={{ marginTop: 0, borderBottom: '1px solid var(--panel-border)', paddingBottom: 10 }}>
                  2. Asset QR
                </h3>

                {phase === 'asset' ? (
                   mode === 'camera' ? (
                    <>
                      <div ref={qrRefAsset} style={{ minHeight: 300, background: '#000', borderRadius: 8, overflow: 'hidden' }} />
                      {!cameraActive 
                        ? <button className="dbu-btn" onClick={() => startCamera(handleScanAsset, qrRefAsset, [Html5QrcodeSupportedFormats.QR_CODE])} style={{ marginTop: 12, width: '100%' }}>Start Asset Camera</button>
                        : <button className="dbu-btn" onClick={stopCamera} style={{ marginTop: 12, width: '100%', background: 'var(--dbu-red)', borderColor: 'var(--dbu-red)' }}>Stop Camera</button>
                      }
                    </>
                   ) : (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--dbu-muted)' }}>
                      <i className="bi bi-qr-code" style={{ fontSize: 48, display: 'block', marginBottom: 10 }}></i>
                      Scan asset QR now
                    </div>
                   )
                ) : (
                  <div style={{ padding: 40, textAlign: 'center', color: 'var(--dbu-muted)' }}>
                    Waiting for student...
                  </div>
                )}
              </div>
            </div>
            
            {status && phase !== 'complete' && (
               <div className={`dbu-banner ${status === 'Student OK' ? 'ok' : 'bad'}`} style={{ marginTop: 20 }}>
                 {status}
               </div>
            )}
            
            {error && <div className="dbu-banner bad" style={{ marginTop: 20 }}>{error}</div>}
          </>
        )}
      </div>
    </div>
  )
}
