import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import Library from './pages/Library'
import TestPage from './pages/TestPage'

// TEMPORARY - remove once real navbar/landing page exists
function DevNav() {
  return (
    <div style={{
      padding: '10px 20px',
      backgroundColor: '#121212',
      borderBottom: '1px solid #262626',
      display: 'flex',
      gap: '16px'
    }}>
      <Link to="/library" style={{ color: '#38bdf8', textDecoration: 'none' }}>Library</Link>
      <Link to="/test" style={{ color: '#38bdf8', textDecoration: 'none' }}>Test Page</Link>
    </div>
  )
}

function App() {

  return (
    <>
      <Header/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Login" element={<Login />} />
        <Route path="/parents-dashBoard" element={<ParentDashBoard />} />
        <Route path="/Signup" element={<Signup />} />
        </Routes>
      <Footer/>
    </>
  )
}

export default App
