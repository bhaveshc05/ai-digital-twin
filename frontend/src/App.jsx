import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ParentsOverview from './pages/ParentsOverview'
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
      padding: '8px 24px',
      backgroundColor: '#090d12',
      borderBottom: '1px solid #1e293b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: '13px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', color: '#94a3b8' }}>⚡ System Status:</span>
        <Link to="/" style={{ color: '#38bdf8', textDecoration: 'none' }}>Home</Link>
        <Link to="/parents-dashboard" style={{ color: '#38bdf8', textDecoration: 'none' }}>Parents Dashboard</Link>
        <Link to="/library" style={{ color: '#38bdf8', textDecoration: 'none' }}>Library</Link>
        <Link to="/test" style={{ color: '#38bdf8', textDecoration: 'none' }}>Test Practice</Link>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <span style={{
          padding: '3px 8px',
          borderRadius: '10px',
          fontSize: '11px',
          fontWeight: 600,
          backgroundColor: nodeStatus === 'online' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
          color: nodeStatus === 'online' ? '#4ade80' : '#f87171',
          border: `1px solid ${nodeStatus === 'online' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
        }}>
          Node API (5000): {nodeStatus.toUpperCase()}
        </span>

        <span style={{
          padding: '3px 8px',
          borderRadius: '10px',
          fontSize: '11px',
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
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/parents-dashboard" element={<ParentsOverview />} />
        <Route path="/library" element={<Library />} />
        <Route path="/test" element={<TestPage />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App
