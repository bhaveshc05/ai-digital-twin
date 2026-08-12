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


function InfoPage({ title, description }) {
  return (
    <div
      className="container py-5 text-light text-center"
      style={{ minHeight: '60vh' }}
    >
      <div
        className="card bg-dark border-secondary p-5 mx-auto"
        style={{
          maxWidth: '600px',
          borderRadius: '16px'
        }}
      >
        <h2 className="fw-bold mb-3 text-info">{title}</h2>

        <p className="lead text-muted mb-4">
          {description}
        </p>

        <Link
          to="/"
          className="btn btn-outline-info px-4"
        >
          Return Home
        </Link>
      </div>
    </div>
  )
}


function App() {
  return (
    <BrowserRouter>
      
      <Header />
      

      <Routes>
        <Route path="/" element={<Home />} />

        <Route path="/Login" element={<Login />} />

        {/* Parents Dashboard */}
        <Route
          path="/parents-dashboard"
          element={<ParentsOverview />}
        />

        <Route path="/Signup" element={<Signup />} />

        <Route path="/library" element={<Library />} />

        <Route path="/test" element={<TestPage />} />
      </Routes>

      <Footer />
    </BrowserRouter>
  )
}


export default App
