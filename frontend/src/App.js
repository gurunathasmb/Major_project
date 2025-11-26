// filepath: C:\Users\mohit\Desktop\Major project\src\App.js
import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Header from "./components/common/Header";
import LoginPage from "./components/auth/LoginPage";
import LoginBackground from "./components/backgrounds/LoginBackground";
import AdminDashboard from "./components/admin/AdminDashboard";
import CreateDoctor from "./components/admin/CreateDoctor";
import ManageDoctors from "./components/admin/ManageDoctors";
import DoctorDashboard from "./components/doctor/DoctorDashboard";
import CreatePatient from "./components/doctor/CreatePatient";
import UploadCephalogram from "./components/doctor/UploadCephalogram";
import AutoLandmark from "./components/doctor/AutoLandmark";
import Classification from "./components/doctor/Classification";
import { AuthContext } from "./context/AuthContext";
import CephalometricModel from "./components/CephalometricModel";
import Lm from "./components/Learnmore";
import './index.css';

export default function App(){
  const { currentUser } = useContext(AuthContext);
  function LoginWithBackground() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <LoginBackground />
      <LoginPage />
    </div>
  );
}

  return (
    <BrowserRouter>
    
      <Header />
      <Routes>
        <Route path="/" element={<CephalometricModel/>} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/lm" element={<Lm />} />
        <Route path="/admin/dashboard" element={ currentUser?.role==="admin" ? <AdminDashboard /> : <Navigate to="/" /> } />
        <Route path="/admin/create-doctor" element={ currentUser?.role==="admin" ? <CreateDoctor /> : <Navigate to="/" /> } />
        <Route path="/admin/manage-doctors" element={ currentUser?.role==="admin" ? <ManageDoctors /> : <Navigate to="/" /> } />

        <Route path="/doctor/dashboard" element={ currentUser?.role==="doctor" ? <DoctorDashboard /> : <Navigate to="/" /> } />
        <Route path="/doctor/create-patient" element={ currentUser?.role==="doctor" ? <CreatePatient /> : <Navigate to="/" /> } />
        <Route path="/doctor/upload-cephalogram" element={ currentUser?.role==="doctor" ? <UploadCephalogram /> : <Navigate to="/" /> } />
        <Route
  path="/doctor/landmark/:id"
  element={currentUser?.role === "doctor" ? <AutoLandmark /> : <Navigate to="/" />}
/>

<Route
  path="/doctor/classification/:id"
  element={currentUser?.role === "doctor" ? <Classification /> : <Navigate to="/" />}
/>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}