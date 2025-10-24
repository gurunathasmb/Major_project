// filepath: C:\Users\mohit\Desktop\Major project\src\context\AuthContext.js
import React, { createContext, useState, useContext } from "react";
import { DoctorContext } from "./DoctorContext";

export const AuthContext = createContext();

export const AuthProvider = ({children})=>{
  const { doctors } = useContext(DoctorContext);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const adminCred = {email: "admin@cephaloai.com", password: "admin123", name:"Admin"};

  const login = (email, password)=>{
    setLoading(true);
    setError(null);
    // simple sync validation
    if (email === adminCred.email && password === adminCred.password) {
      setCurrentUser({id: "ADMIN", email: adminCred.email, name: adminCred.name, role: "admin"});
      setLoading(false);
      return true;
    }
    const doctor = doctors.find(d=> d.email===email && d.password===password);
    if (doctor) {
      if (!doctor.isActive) {
        setError("Account deactivated");
        setLoading(false);
        return false;
      }
      setCurrentUser({id: doctor.id, email: doctor.email, name: doctor.name, role: "doctor"});
      setLoading(false);
      return true;
    }
    setError("Invalid credentials");
    setLoading(false);
    return false;
  };

  const logout = ()=> setCurrentUser(null);
  const isAdmin = ()=> currentUser?.role === "admin";
  const isDoctor = ()=> currentUser?.role === "doctor";
  const isAuthenticated = ()=> !!currentUser;

  return (
    <AuthContext.Provider value={{currentUser, loading, error, login, logout, isAdmin, isDoctor, isAuthenticated}}>
      {children}
    </AuthContext.Provider>
  );
};