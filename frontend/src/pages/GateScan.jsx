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
    <div className="dbu-container" style={{ maxWidth: 1000 }}>
      <div className="dbu-card">
        <h2>Gate Operator</h2>
        <div style={{ marginBottom: 12 }}>
          <strong>Logged in:</strong> {user?.username} ({user?.role})
        </div>
        <div style={{ marginBottom: 16 }}>
          <label>Scan Mode</label>{' '}
          <select value={mode} onChange={e => { stopCamera(); setMode(e.target.value); if (e.target.value === 'camera') autoStartStudentCamera() }}>
            <option value="camera">Camera</option>
            <option value="usb">USB Scanner</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div style={{ border: '1px solid #ddd', padding: 12 }}>
            <h3>Scan Student ID</h3>
            {mode === 'camera' ? (
              <>
                <div ref={qrRefStudent} style={{ minHeight: 280, background: '#f7f7f7' }} />
                {!cameraActive
                  ? <button onClick={() => startCamera(
                      handleScanStudent,
                      qrRefStudent,
                      [
                        Html5QrcodeSupportedFormats.CODE_128,
                        Html5QrcodeSupportedFormats.EAN_13,
                        Html5QrcodeSupportedFormats.QR_CODE
                      ]
                    )} style={{ marginTop: 8 }}>Start Camera</button>
                  : <button onClick={stopCamera} style={{ marginTop: 8 }}>Stop Camera</button>}
              </>
            ) : (
              <>
                <div className="dbu-muted">Scan the student barcode with your USB scanner</div>
              </>
            )}
          </div>

          <div style={{ border: '1px solid #ddd', padding: 12 }}>
            <h3>Scan Asset QR</h3>
            {mode === 'camera' ? (
              <>
                <div ref={qrRefAsset} style={{ minHeight: 280, background: '#f7f7f7' }} />
                {!cameraActive
                  ? <button onClick={() => startCamera(
                      handleScanAsset,
                      qrRefAsset,
                      [Html5QrcodeSupportedFormats.QR_CODE]
                    )} style={{ marginTop: 8 }}>Start Camera</button>
                  : <button onClick={stopCamera} style={{ marginTop: 8 }}>Stop Camera</button>}
              </>
            ) : (
              <>
                <div className="dbu-muted">Scan the asset QR with your USB scanner</div>
              </>
            )}
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          {status && <div className={`dbu-banner ${status === 'ALLOWED' || status === 'Student OK' ? 'ok' : 'bad'}`}>{status}</div>}
          {error && <div style={{ color: 'red' }}>{error}</div>}
          {result && (
            <div style={{ marginTop: 8 }}>
              <div className="dbu-owner">
                <div className="dbu-owner-left">
                  <div className="dbu-avatar">{(result.student?.full_name || result.student?.student_id || 'U').split(' ').map(x => x[0]).join('').slice(0,2).toUpperCase()}</div>
                  <div>
                    <div className="dbu-owner-name">{result.student?.full_name || result.student?.student_id}</div>
                    <div className="dbu-owner-id">{result.student?.student_id}</div>
                  </div>
                </div>
                <div className="dbu-owner-right">
                  {'has_assets' in result && <div className="dbu-pill">Assets: {result.asset_count}</div>}
                  {result.student?.status && <div className="dbu-pill">{result.student.status}</div>}
                </div>
              </div>
              {result.asset && (
                <div className="dbu-card" style={{ marginTop: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div><strong>ID</strong><div>#{result.asset.asset_id}</div></div>
                    <div><strong>Brand</strong><div>{result.asset.brand}</div></div>
                    <div><strong>Color</strong><div>{result.asset.color}</div></div>
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
