<<<<<<< HEAD
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
import Dashboard from './pages/Dashboard'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
=======
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";

import Header from "./components/Header";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ParentsOverview from "./pages/ParentsOverview";
import Library from "./pages/Library";
import TestPage from "./pages/TestPage";
import PDFUpload from "./pages/PDFUpload";
import StudentProfile from "./pages/StudentProfile";

import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
>>>>>>> 004e860e558146f4ab1ccacf9eb40a15724c73f5


function InfoPage({ title, description }) {
  return (
    <div
      className="container py-5 text-light text-center"
      style={{ minHeight: "60vh" }}
    >
      <div
        className="card bg-dark border-secondary p-5 mx-auto"
        style={{
          maxWidth: "600px",
          borderRadius: "16px",
        }}
      >
        <h2 className="fw-bold mb-3 text-info">
          {title}
        </h2>

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
  );
}


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>

        <Header />

        <Routes>

<<<<<<< HEAD
          <Route path="/Login" element={<Login />} />

          <Route path="/dashboard" element={<Dashboard />} />

          {/* Parents Dashboard */}
=======
          {/* Public Home */}
>>>>>>> 004e860e558146f4ab1ccacf9eb40a15724c73f5
          <Route
            path="/"
            element={<Home />}
          />

          {/* Public Login */}
          <Route
            path="/login"
            element={<Login />}
          />

          {/* Public Signup */}
          <Route
            path="/signup"
            element={<Signup />}
          />

          {/* Public Library */}
          <Route
            path="/library"
            element={<Library />}
          />

          {/* Public Test Practice */}
          <Route
            path="/test"
            element={<TestPage />}
          />

          {/* Protected Parents Dashboard */}
          <Route
            path="/parents-dashboard"
            element={
              <ProtectedRoute>
                <ParentsOverview />
              </ProtectedRoute>
            }
          />

          {/* Protected PDF Upload */}
          <Route
            path="/upload-pdf"
            element={
              <ProtectedRoute>
                <PDFUpload />
              </ProtectedRoute>
            }
          />

          {/* Protected Student Profile */}
          <Route
            path="/student-profile"
            element={
              <ProtectedRoute>
                <StudentProfile />
              </ProtectedRoute>
            }
          />

        </Routes>

        <Footer />

      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
