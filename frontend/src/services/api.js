import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`
const useMock = (import.meta.env.VITE_USE_MOCK === 'true')

const api = axios.create({
  baseURL: `${baseURL}/api`,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

const DB_KEY = 'dbu_localdb'
const nowIso = () => new Date().toISOString()
const loadDB = () => {
  try {
    const raw = localStorage.getItem(DB_KEY)
    const db = raw ? JSON.parse(raw) : null
    if (db) return db
  } catch {}
  const seed = {
    students: [
      { id: 'STU-1001', name: 'Abebe Kebede', status: 'active', department: 'Computer Science', year: '4th' },
      { id: 'STU-1002', name: 'Sara Alemu', status: 'blocked', department: 'Civil Engineering', year: '3rd' },
      { id: 'STU-1003', name: 'Chala Desta', status: 'active', department: 'Electrical Engineering', year: '5th' },
      { id: 'STU-1004', name: 'Hana Girma', status: 'active', department: 'Medicine', year: '2nd' },
      { id: 'STU-1005', name: 'Kebede Tadesse', status: 'active', department: 'Accounting', year: '3rd' },
      { id: 'STU-1006', name: 'Mulugeta Assefa', status: 'active', department: 'Economics', year: '4th' },
      { id: 'STU-1007', name: 'Tigist Bekele', status: 'blocked', department: 'Law', year: '2nd' },
      { id: 'STU-1008', name: 'Yonas Haile', status: 'active', department: 'Software Engineering', year: '3rd' },
      { id: 'STU-1009', name: 'Lia Tadesse', status: 'active', department: 'Public Health', year: '4th' },
      { id: 'STU-1010', name: 'Dawit Mekonnen', status: 'active', department: 'Information Systems', year: '3rd' }
    ],
    assets: [
      { asset_id: 101, owner_student_id: 'STU-1001', serial_number: 'SN-DELL-001', brand: 'Dell', color: 'Black', visible_specs: 'i5/8GB', status: 'active', registered_at: nowIso(), qr_signature: 'QR-101' },
      { asset_id: 102, owner_student_id: 'STU-1003', serial_number: 'SN-HP-002', brand: 'HP', color: 'Silver', visible_specs: 'i7/16GB', status: 'active', registered_at: nowIso(), qr_signature: 'QR-102' },
      { asset_id: 103, owner_student_id: 'STU-1004', serial_number: 'SN-MAC-003', brand: 'Apple', color: 'Gray', visible_specs: 'M1/8GB', status: 'blocked', registered_at: nowIso(), qr_signature: 'QR-103' },
      { asset_id: 104, owner_student_id: 'STU-1006', serial_number: 'SN-LEN-004', brand: 'Lenovo', color: 'Black', visible_specs: 'ThinkPad X1', status: 'active', registered_at: nowIso(), qr_signature: 'QR-104' },
      { asset_id: 105, owner_student_id: 'STU-1008', serial_number: 'SN-ASUS-005', brand: 'Asus', color: 'Blue', visible_specs: 'ZenBook', status: 'active', registered_at: nowIso(), qr_signature: 'QR-105' },
      { asset_id: 106, owner_student_id: 'STU-1010', serial_number: 'SN-ACER-006', brand: 'Acer', color: 'Silver', visible_specs: 'Aspire 5', status: 'active', registered_at: nowIso(), qr_signature: 'QR-106' }
    ],
    logs: [
      { log_id: 1, student_id: 'STU-1001', asset_id: 101, result: 'ALLOWED', reason: 'Exit verified successfully', timestamp: new Date(Date.now() - 100000).toISOString() },
      { log_id: 2, student_id: 'STU-1002', asset_id: null, result: 'BLOCKED', reason: 'Student invalid or inactive', timestamp: new Date(Date.now() - 200000).toISOString() },
      { log_id: 3, student_id: 'STU-1003', asset_id: 102, result: 'ALLOWED', reason: 'Exit verified successfully', timestamp: new Date(Date.now() - 300000).toISOString() },
      { log_id: 4, student_id: 'STU-1004', asset_id: 103, result: 'BLOCKED', reason: 'Asset blocked', timestamp: new Date(Date.now() - 400000).toISOString() }
    ],
    operators: []
  }
  localStorage.setItem(DB_KEY, JSON.stringify(seed))
  return seed
}
const saveDB = (db) => {
  localStorage.setItem(DB_KEY, JSON.stringify(db))
}

const delay = (v, ms = 250) => new Promise(res => setTimeout(() => res(v), ms))
const fakeJwt = (username, role = 'gate_operator') => {
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24
  const payload = btoa(JSON.stringify({ sub: username, role, exp }))
  return `${header}.${payload}.`
}

export const login = async (username, password) => {
  if (useMock) {
    let role = null
    if (username === 'admin' && password === 'admin123') role = 'admin'
    else if (username === 'operator' && password === 'operator123') role = 'gate_operator'
    
    if (!role) {
      return Promise.reject({ response: { status: 401, data: { message: 'Invalid credentials' } } })
    }

    const token = fakeJwt(username, role)
    const db = loadDB()
    if (!db.operators.find(o => o.username === username)) {
      db.operators.push({ id: db.operators.length + 1, username, role, created_at: nowIso() })
      saveDB(db)
    }
    return delay({ access_token: token, user: { id: 1, username, role } })
  }
  const { data } = await api.post('/auth/login', { username, password })
  return data
}

export const scanStudent = async (student_id) => {
  if (useMock) {
    const db = loadDB()
    const student = db.students.find(s => String(s.id) === String(student_id))
    
    if (!student) {
      return delay({
        status: 'BLOCKED',
        reason: 'Student not found in database',
        student: { id: student_id, name: 'Unknown', status: 'unknown' },
        has_assets: false,
        asset_count: 0
      })
    }

    const activeAssets = db.assets.filter(a => String(a.owner_student_id) === String(student_id) && a.status === 'active')
    const exitToken = `EXIT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    
    return delay({
      status: student.status === 'active' ? 'OK' : 'BLOCKED',
      reason: student.status === 'active' ? 'Student verified' : 'Student is blocked',
      student,
      has_assets: activeAssets.length > 0,
      asset_count: activeAssets.length,
      exit_token: exitToken
    })
  }
  const { data } = await api.post('/gate/exit/scan-student', { student_id })
  return data
}

export const scanAsset = async (student_id, qr_data, exit_token) => {
  if (useMock) {
    const db = loadDB()
    const student = db.students.find(s => String(s.id) === String(student_id))
    const asset = db.assets.find(a => a.qr_signature === qr_data)
    
    let result = 'ALLOWED'
    let reason = 'Exit verified successfully'
    
    if (!student || student.status !== 'active') { result = 'BLOCKED'; reason = 'Student invalid or inactive' }
    else if (!asset) { result = 'BLOCKED'; reason = 'Invalid QR Code' }
    else if (String(asset.owner_student_id) !== String(student_id)) { result = 'BLOCKED'; reason = 'Ownership mismatch' }
    else if (asset.status !== 'active') { result = 'BLOCKED'; reason = `Asset ${asset.status}` }
    
    const log = { log_id: db.logs.length + 1, student_id, asset_id: asset?.asset_id, result, reason, timestamp: nowIso() }
    db.logs.unshift(log)
    saveDB(db)
    
    return delay({
      status: result,
      reason,
      student: student || { id: student_id, name: `Student ${student_id}`, status: 'blocked' },
      asset: asset || { asset_id: null, serial_number: 'Unknown', owner_student_id: student_id, status: 'unknown' }
    })
  }
  const { data } = await api.post('/gate/exit/scan-asset', { student_id, qr_data, exit_token })
  return data
}

export const exitWithoutAsset = async (student_id, exit_token) => {
  if (useMock) {
    const db = loadDB()
    const student = db.students.find(s => String(s.id) === String(student_id))
    
    let result = 'ALLOWED'
    let reason = 'Exit without assets verified'
    
    if (!student) {
      result = 'BLOCKED'
      reason = 'Student not found in database'
    } else {
      const hasAssets = db.assets.some(a => String(a.owner_student_id) === String(student_id) && a.status === 'active')
      if (hasAssets) { result = 'BLOCKED'; reason = 'Registered assets present' }
      if (student.status !== 'active') { result = 'BLOCKED'; reason = 'Student invalid or inactive' }
    }

    const log = { log_id: db.logs.length + 1, student_id, result, reason, timestamp: nowIso() }
    db.logs.unshift(log)
    saveDB(db)
    return delay({ status: result, reason, student: student || { id: student_id, name: 'Unknown', status: 'unknown' } })
  }
  const { data } = await api.post('/gate/exit/exit-without-asset', { student_id, exit_token })
  return data
}

export const exitLogs = async (limit = 50) => {
  if (useMock) {
    const db = loadDB()
    return delay(db.logs.slice(0, limit))
  }
  const { data } = await api.get(`/gate/exit/logs?limit=${limit}`)
  return data.logs
}

export const adminRegisterAsset = async (payload) => {
  if (useMock) {
    const db = loadDB()
    const existing = db.assets.find(a => a.serial_number === payload.serial_number)
    if (existing) return delay({ status: 'CONFLICT', message: 'Asset with this serial number already exists', existing_asset: existing })
    const id = (db.assets.reduce((m, a) => Math.max(m, a.asset_id), 100) || 100) + 1
    const asset = {
      asset_id: id,
      owner_student_id: payload.owner_student_id,
      serial_number: payload.serial_number,
      brand: payload.brand,
      color: payload.color,
      visible_specs: payload.visible_specs,
      status: 'active',
      registered_at: nowIso(),
      qr_signature: `QR-${id}`
    }
    db.assets.push(asset)
    saveDB(db)
    return delay({ message: 'Asset registered successfully', asset, qr_data: asset.qr_signature, student: db.students.find(s => String(s.id) === String(payload.owner_student_id)) || { id: payload.owner_student_id, status: 'active' } })
  }
  const { data } = await api.post('/admin/register-asset', payload)
  return data
}

export const adminAssets = async () => {
  if (useMock) {
    const db = loadDB()
    return delay(db.assets)
  }
  const { data } = await api.get('/admin/assets')
  return data.assets
}

export const adminStudents = async () => {
  if (useMock) {
    const db = loadDB()
    return delay(db.students)
  }
  const { data } = await api.get('/admin/students')
  return data.students
}

export const adminStatistics = async () => {
  if (useMock) {
    const db = loadDB()
    const total_students = db.students.length
    const active_students = db.students.filter(s => s.status === 'active').length
    const total_assets = db.assets.length
    const active_assets = db.assets.filter(a => a.status === 'active').length
    const total_exits = db.logs.length
    const allowed_exits = db.logs.filter(l => l.result === 'ALLOWED').length
    const blocked_exits = db.logs.filter(l => l.result === 'BLOCKED').length
    return delay({ total_students, active_students, total_assets, active_assets, total_exits, allowed_exits, blocked_exits })
  }
  const { data } = await api.get('/admin/statistics')
  return data.statistics
}

export const adminStudentStatus = async (student_id, status) => {
  if (useMock) {
    const db = loadDB()
    let student = db.students.find(s => String(s.id) === String(student_id))
    if (!student) { student = { id: student_id, name: `Student ${student_id}`, status } ; db.students.push(student) }
    else { student.status = status }
    saveDB(db)
    return delay({ message: 'Student status updated', student })
  }
  const { data } = await api.post('/admin/student-status', { student_id, status })
  return data
}

export const adminUpdateAsset = async (asset_id, updates) => {
  if (useMock) {
    const db = loadDB()
    const asset = db.assets.find(a => String(a.asset_id) === String(asset_id))
    if (asset) {
      Object.assign(asset, updates)
      saveDB(db)
    }
    return delay({ message: 'Asset updated successfully', asset: asset || { asset_id, ...updates } })
  }
  const { data } = await api.put(`/admin/assets/${asset_id}`, updates)
  return data
}

export const adminAssetStatus = async (asset_id, status) => {
  if (useMock) {
    const db = loadDB()
    const asset = db.assets.find(a => String(a.asset_id) === String(asset_id))
    if (asset) { asset.status = status ; saveDB(db) }
    return delay({ message: 'Asset status updated', asset: asset || { asset_id, status } })
  }
  const { data } = await api.post('/admin/asset-status', { asset_id, status })
  return data
}

export default api
