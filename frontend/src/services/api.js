const NODE_API_URL = import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000'
const FASTAPI_URL = import.meta.env.VITE_FASTAPI_URL || 'http://localhost:8000'

export async function checkNodeHealth() {
  try {
    const res = await fetch(`${NODE_API_URL}/health`)
    if (!res.ok) return { status: 'offline', error: `HTTP ${res.status}` }
    const data = await res.json()
    return { status: 'online', ...data }
  } catch (err) {
    return { status: 'offline', error: err.message }
  }
}

export async function checkFastAPIHealth() {
  try {
    const res = await fetch(`${FASTAPI_URL}/health`)
    if (!res.ok) return { status: 'offline', error: `HTTP ${res.status}` }
    const data = await res.json()
    return { status: 'online', ...data }
  } catch (err) {
    return { status: 'offline', error: err.message }
  }
}

export async function fetchStudents() {
  try {
    const res = await fetch(`${NODE_API_URL}/api/students`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Error fetching students:', err)
    return { success: false, error: err.message }
  }
}

export async function registerStudent(studentData) {
  try {
    const res = await fetch(`${NODE_API_URL}/api/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(studentData),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`)
    }
    return data
  } catch (err) {
    console.error('Error saving student to PostgreSQL:', err)
    return { success: false, error: err.message }
  }
}

export async function loginStudent(email, password) {
  try {
    const res = await fetch(`${NODE_API_URL}/api/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })
    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || `HTTP ${res.status}`)
    }
    return data
  } catch (err) {
    console.error('Error logging in student:', err)
    return { success: false, error: err.message }
  }
}

export async function fetchFastAPIChunks() {
  try {
    const res = await fetch(`${FASTAPI_URL}/api/v1/chunks`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } catch (err) {
    console.error('Error fetching FastAPI chunks:', err)
    return { chunks: [] }
  }
}
