import { useState } from 'react'
import "bootstrap/dist/css/bootstrap.min.css";
import { Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from './pages/Login';
import Signup from './pages/Signup';
import ParentDashBoard from './pages/ParentsOverview'

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
