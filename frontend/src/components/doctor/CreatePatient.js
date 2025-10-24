// filepath: C:\Users\mohit\Desktop\Major project\src\components\doctor\CreatePatient.js
import React, { useState, useContext } from "react";
import { PatientContext } from "../../context/PatientContext";
import { AuthContext } from "../../context/AuthContext";
import { DoctorContext } from "../../context/DoctorContext";
import { useNavigate } from "react-router-dom";

export default function CreatePatient(){
  const { addPatient } = useContext(PatientContext);
  const { currentUser } = useContext(AuthContext);
  const { getDoctorById } = useContext(DoctorContext);
  const nav = useNavigate();
  const [form, setForm] = useState({name:"",age:"",gender:"M",email:"",phone:"",address:""});

  const submit = (e)=>{
    e.preventDefault();
    const doctor = getDoctorById(currentUser.id);
    addPatient({...form, age: Number(form.age), doctorId: currentUser.id, doctorName: doctor?.name || ""});
    nav("/doctor/dashboard");
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Create Patient</h2>
      <form onSubmit={submit} className="bg-white p-4 rounded shadow space-y-3">
        <input required placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border p-2 rounded"/>
        <input required type="number" placeholder="Age" value={form.age} onChange={e=>setForm({...form,age:e.target.value})} className="w-full border p-2 rounded"/>
        <select value={form.gender} onChange={e=>setForm({...form,gender:e.target.value})} className="w-full border p-2 rounded">
          <option value="M">Male</option><option value="F">Female</option><option value="Other">Other</option>
        </select>
        <input placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full border p-2 rounded"/>
        <input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full border p-2 rounded"/>
        <input placeholder="Address" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} className="w-full border p-2 rounded"/>
        <div className="flex justify-end">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded">Create</button>
        </div>
      </form>
    </main>
  );
}