// filepath: C:\Users\mohit\Desktop\Major project\src\context\PatientContext.js
import React, { createContext, useState } from "react";
import { genId, isoNow } from "../utils/helpers";

export const PatientContext = createContext();

export const PatientProvider = ({children})=>{
  const [patients, setPatients] = useState([]);
  const [cephalograms, setCephalograms] = useState([]);

  const addPatient = (data)=>{
    const id = genId("P", patients);
    const newP = {...data, id, createdDate: isoNow()};
    setPatients(prev=>[...prev, newP]);
    return newP;
  };

  const getPatientsByDoctor = (doctorId)=> patients.filter(p=>p.doctorId===doctorId);

  const uploadCephalogram = (data)=>{
    const id = genId("C", cephalograms);
    const newC = {
      id,
      ...data,
      uploadDate: isoNow(),
      status: "Pending",
      landmarks: [],
      analysis: null
    };
    setCephalograms(prev=>[...prev, newC]);
    return newC;
  };

  const getCephalogramsByPatient = (patientId)=> cephalograms.filter(c=>c.patientId===patientId);
  const getCephalogramById = (id)=> cephalograms.find(c=>c.id===id);

  const updateCephalogramAnalysis = (id, landmarks, analysis)=>{
    setCephalograms(prev=>prev.map(c=> c.id===id ? {...c, landmarks, analysis, status:"Completed"} : c));
  };

  return (
    <PatientContext.Provider value={{
      patients, cephalograms, addPatient, getPatientsByDoctor,
      uploadCephalogram, getCephalogramsByPatient, updateCephalogramAnalysis, getCephalogramById
    }}>
      {children}
    </PatientContext.Provider>
  );
};