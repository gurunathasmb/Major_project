// filepath: C:\Users\mohit\Desktop\Major project\src\components\auth\LoginPage.js
import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { DoctorContext } from "../../context/DoctorContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage(){
  const { login, error } = useContext(AuthContext);
  const { doctors } = useContext(DoctorContext);
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  const onSubmit = (e)=>{
    e.preventDefault();
    const ok = login(email,password);
    if (ok) {
      // route based on role detected by auth context's currentUser - simple heuristic
      const isAdmin = email === "admin@cephaloai.com";
      if (isAdmin) nav("/admin/dashboard");
      else nav("/doctor/dashboard");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Login</h2>
        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Role</label>
            <select value={role} onChange={e=>setRole(e.target.value)} className="w-full border p-2 rounded">
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-gray-600">Email</label>
            <input required value={email} onChange={e=>setEmail(e.target.value)} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="text-sm text-gray-600">Password</label>
            <input required type="password" value={password} onChange={e=>setPassword(e.target.value)} className="w-full border p-2 rounded" />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button className="w-full bg-indigo-600 text-white py-2 rounded">Sign in</button>
        </form>
        <div className="text-xs text-gray-500 mt-3">
          Admin: admin@cephaloai.com / admin123<br/>
          Demo doctor: doctor.smith@hospital.com / doctor123
        </div>
      </div>
    </div>
  );
}