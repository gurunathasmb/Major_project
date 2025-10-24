// filepath: C:\Users\mohit\Desktop\Major project\src\context\DoctorContext.js
import React, { createContext, useState } from "react";
import { genId, isoNow } from "../utils/helpers";

export const DoctorContext = createContext();

const initialDoctors = [{
  id: "DOC001",
  name: "Dr. Sarah Smith",
  email: "doctor.smith@hospital.com",
  password: "doctor123",
  role: "doctor",
  specialization: "Orthodontics",
  licenseNumber: "MED12345",
  phone: "+1234567890",
  createdDate: "2024-10-22",
  isActive: true,
  createdBy: "admin@cephaloai.com"
}];

export const DoctorProvider = ({children})=>{
  const [doctors, setDoctors] = useState(initialDoctors);

  const addDoctor = (data)=>{
    const id = genId("DOC", doctors);
    const newDoc = {...data, id, role:"doctor", createdDate: isoNow(), isActive: true};
    setDoctors(prev=>[...prev, newDoc]);
    return newDoc;
  };

  const updateDoctor = (id, updates)=>{
    setDoctors(prev=>prev.map(d=> d.id===id ? {...d,...updates} : d));
  };

  const deactivateDoctor = (id)=>{
    setDoctors(prev=>prev.map(d=> d.id===id ? {...d, isActive:false} : d));
  };

  const getDoctorById = (id)=> doctors.find(d=>d.id===id);

  return (
    <DoctorContext.Provider value={{doctors, addDoctor, updateDoctor, deactivateDoctor, getDoctorById}}>
      {children}
    </DoctorContext.Provider>
  );
};