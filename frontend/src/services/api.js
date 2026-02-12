import axios from 'axios'

const baseURL = import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000`

const api = axios.create({
  baseURL: `${baseURL}/api`,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export const login = async (username, password) => {
  const { data } = await api.post('/auth/login', { username, password })
  return data
}

export const scanStudent = async (student_id) => {
  const { data } = await api.post('/gate/exit/scan-student', { student_id })
  return data
}

export const scanAsset = async (student_id, qr_data, exit_token) => {
  const { data } = await api.post('/gate/exit/scan-asset', { student_id, qr_data, exit_token })
  return data
}

export const exitWithoutAsset = async (student_id, exit_token) => {
  const { data } = await api.post('/gate/exit/exit-without-asset', { student_id, exit_token })
  return data
}

export const exitLogs = async (limit = 50) => {
  const { data } = await api.get(`/gate/exit/logs?limit=${limit}`)
  return data.logs
}

export const adminRegisterAsset = async (payload) => {
  const { data } = await api.post('/admin/register-asset', payload)
  return data
}

export const adminAssets = async () => {
  const { data } = await api.get('/admin/assets')
  return data.assets
}

export const adminStudents = async () => {
  const { data } = await api.get('/admin/students')
  return data.students
}

export const adminStatistics = async () => {
  const { data } = await api.get('/admin/statistics')
  return data.statistics
}

export const adminStudentStatus = async (student_id, status) => {
  const { data } = await api.post('/admin/student-status', { student_id, status })
  return data
}

export const adminAssetStatus = async (asset_id, status) => {
  const { data } = await api.post('/admin/asset-status', { asset_id, status })
  return data
}

export default api
