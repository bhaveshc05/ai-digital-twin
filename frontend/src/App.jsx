import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import Library from './pages/Library'
import TestPage from './pages/TestPage'
import Header from './components/Header'
import Footer from './components/Footer'
import Home from './pages/Home'
import Login from './pages/Login'
import Signup from './pages/Signup'
import ParentsOverview from './pages/ParentsOverview'

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
        <Route path="/parents-dashboard" element={<ParentsOverview />} />
        <Route path="/Signup" element={<Signup />} />
        <Route path="/Library" element={<Library />} />
        <Route path="/TestPage" element={<TestPage />} /> 
        </Routes>
      <Footer/>
    </>
  )
}

export default App
