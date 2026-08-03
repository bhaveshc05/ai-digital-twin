import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import Library from './pages/Library'
import TestPage from './pages/TestPage'
import { checkNodeHealth, checkFastAPIHealth } from './services/api'

function DevNav() {
  const [nodeStatus, setNodeStatus] = useState('checking')
  const [fastapiStatus, setFastapiStatus] = useState('checking')

  const pollHealth = async () => {
    const nodeRes = await checkNodeHealth()
    setNodeStatus(nodeRes.status === 'online' || nodeRes.status === 'healthy' ? 'online' : 'offline')

    const fastapiRes = await checkFastAPIHealth()
    setFastapiStatus(fastapiRes.status === 'online' || fastapiRes.status === 'healthy' ? 'online' : 'offline')
  }

  useEffect(() => {
    pollHealth()
    const interval = setInterval(pollHealth, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      padding: '12px 24px',
      backgroundColor: '#0e141a',
      borderBottom: '1px solid #262626',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '14px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', color: '#f8fafc' }}>AI Digital Twin</span>
        <Link to="/library" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 500 }}>Library</Link>
        <Link to="/test" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 500 }}>Test Page</Link>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <span style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: nodeStatus === 'online' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: nodeStatus === 'online' ? '#4ade80' : '#f87171',
          border: `1px solid ${nodeStatus === 'online' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
        }}>
          Node API (5000): {nodeStatus.toUpperCase()}
        </span>

        <span style={{
          padding: '4px 10px',
          borderRadius: '12px',
          fontSize: '12px',
          fontWeight: 600,
          backgroundColor: fastapiStatus === 'online' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: fastapiStatus === 'online' ? '#4ade80' : '#f87171',
          border: `1px solid ${fastapiStatus === 'online' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
        }}>
          FastAPI (8000): {fastapiStatus.toUpperCase()}
        </span>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <DevNav />
      <Routes>
        <Route path="/" element={<Navigate to="/library" replace />} />
        <Route path="/library" element={<Library />} />
        <Route path="/test" element={<TestPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App