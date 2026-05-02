// filepath: src/App.js
import React, { useContext } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import PublicLayout from "./components/common/PublicLayout";

// Auth
import LoginPage from "./components/auth/LoginPage";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPassword from "./components/auth/ResetPassword";
import ProfileSetup from "./components/common/ProfileSetup";
import Chat from "./components/common/Chat";

// Admin
import AdminDashboard from "./components/admin/AdminDashboard";
import ManageDoctors from "./components/admin/ManageDoctors";
import AdminLayout from "./components/admin/AdminLayout";
import Analytics from "./components/admin/Analytics";
import PatientsPage from "./components/admin/PatientsPage";
import PredictionsPage from "./components/admin/PredictionsPage";
import Adminprofile from "./components/common/ProfilePage";
import AdvancedAnalysis from "./components/admin/AdvancedAnalysis";
import HostApprovals from "./components/admin/HostApprovals";

// Doctor
import DoctorDashboard from "./components/doctor/DoctorDashboard";
import DoctorLayout from "./components/doctor/DoctorLayout";
import CreatePatient from "./components/doctor/CreatePatient";
import UploadCephalogram from "./components/doctor/UploadCephalogram";
import UploadAirway from "./components/doctor/UploadAirway";
import AirwayAnalysisView from "./components/doctor/AirwayAnalysisView";
import AutoLandmark from "./components/doctor/AutoLandmark";
import ManualAdjust from "./components/doctor/ManualAdjust";
import ClassificationView from "./components/doctor/ClassificationView";
import DoctorProfile from "./components/common/ProfilePage";
import Appointments from "./components/doctor/Appointments";

// General
import CephalometricModel from "./components/CephalometricModel";
import Lm from "./components/Learnmore";
import PatientRegistrationForm from "./components/public/PatientRegistrationForm";

import { AuthContext } from "./context/AuthContext";
import "./index.css";

export default function App() {
  const { currentUser, profile, loading } = useContext(AuthContext);

  // 🔥 WAIT UNTIL EVERYTHING LOADED
  if (loading || (currentUser && !profile)) {
    return (
      <div className="h-screen bg-[#050814] flex items-center justify-center text-lg text-white">
        Loading Application...
      </div>
    );
  }

  // ==============================
  // 🔥 PROTECTED ROUTE
  const ProtectedRoute = ({ role, children }) => {
    if (!currentUser) return <Navigate to="/login" replace />;
    if (!profile?.is_profile_complete) return <Navigate to="/profile-setup" replace />;
    if (role && currentUser.role !== role) return <Navigate to="/" replace />;
    return children;
  };

  return (
    <BrowserRouter>
      <Routes>
        
        {/* ================= PUBLIC (Using 3JS Background + Glass Header) ================= */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<CephalometricModel />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/lm" element={<Lm />} />
          <Route path="/register-patient/:doctorId" element={<PatientRegistrationForm />} />
          <Route path="/profile-setup" element={
            currentUser ? <ProfileSetup /> : <Navigate to="/login" replace />
          } />
        </Route>

        {/* ================= ADMIN ================= */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute role="admin"><AdminLayout><AdminDashboard /></AdminLayout></ProtectedRoute>
        } />
        <Route path="/admin/profile" element={
          <ProtectedRoute role="admin"><AdminLayout><Adminprofile /></AdminLayout></ProtectedRoute>
        } />
        <Route path="/admin/manage-doctors" element={
          <ProtectedRoute role="admin"><AdminLayout><ManageDoctors /></AdminLayout></ProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <ProtectedRoute role="admin"><AdminLayout><Analytics /></AdminLayout></ProtectedRoute>
        } />
        <Route path="/admin/advancedanalytics" element={
          <ProtectedRoute role="admin"><AdminLayout><AdvancedAnalysis /></AdminLayout></ProtectedRoute>
        } />
        <Route path="/admin/patients" element={
          <ProtectedRoute role="admin"><AdminLayout><PatientsPage /></AdminLayout></ProtectedRoute>
        } />
        <Route path="/admin/predictions" element={
          <ProtectedRoute role="admin"><AdminLayout><PredictionsPage /></AdminLayout></ProtectedRoute>
        } />
        <Route path="/admin/host-approvals" element={
          <ProtectedRoute role="admin">
            {(() => {
              const masterEmails = ["guru819773@gmail.com", "gurunathagoudambiradar@gmail.com", "gurunathagouda@gmail.com"];
              return masterEmails.includes(currentUser?.username?.toLowerCase()) ? (
                <AdminLayout><HostApprovals /></AdminLayout>
              ) : (
                <Navigate to="/admin/dashboard" replace />
              );
            })()}
          </ProtectedRoute>
        } />
        <Route path="/admin/chat" element={
          <ProtectedRoute role="admin"><AdminLayout><Chat /></AdminLayout></ProtectedRoute>
        } />

        {/* ================= DOCTOR ================= */}
        <Route path="/doctor/dashboard" element={
          <ProtectedRoute role="doctor"><DoctorLayout><DoctorDashboard /></DoctorLayout></ProtectedRoute>
        } />
        <Route path="/doctor/appointments" element={
          <ProtectedRoute role="doctor"><DoctorLayout><Appointments /></DoctorLayout></ProtectedRoute>
        } />
        <Route path="/doctor/profile" element={
          <ProtectedRoute role="doctor"><DoctorLayout><DoctorProfile /></DoctorLayout></ProtectedRoute>
        } />
        <Route path="/doctor/create-patient" element={
          <ProtectedRoute role="doctor"><DoctorLayout><CreatePatient /></DoctorLayout></ProtectedRoute>
        } />
        <Route path="/doctor/upload-cephalogram" element={
          <ProtectedRoute role="doctor"><DoctorLayout><UploadCephalogram /></DoctorLayout></ProtectedRoute>
        } />
        <Route path="/doctor/landmark/:id" element={
          <ProtectedRoute role="doctor"><DoctorLayout><AutoLandmark /></DoctorLayout></ProtectedRoute>
        } />
        <Route path="/doctor/manual-adjust/:id" element={
          <ProtectedRoute role="doctor"><DoctorLayout><ManualAdjust /></DoctorLayout></ProtectedRoute>
        } />
        <Route path="/doctor/classification/:id" element={
          <ProtectedRoute role="doctor"><DoctorLayout><ClassificationView /></DoctorLayout></ProtectedRoute>
        } />
        <Route path="/doctor/upload-airway" element={
          <ProtectedRoute role="doctor"><DoctorLayout><UploadAirway /></DoctorLayout></ProtectedRoute>
        } />
        <Route path="/doctor/airway-analysis/:id" element={
          <ProtectedRoute role="doctor"><DoctorLayout><AirwayAnalysisView /></DoctorLayout></ProtectedRoute>
        } />
        <Route path="/doctor/chat" element={
          <ProtectedRoute role="doctor"><DoctorLayout><Chat /></DoctorLayout></ProtectedRoute>
        } />

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/" />} />

      </Routes>
    </BrowserRouter>
  );
}