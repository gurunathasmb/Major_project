// filepath: C:\Users\mohit\Desktop\Major project\src\components\admin\CreateDoctor.js
import React, { useState, useContext } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { useNavigate } from "react-router-dom";

export default function CreateDoctor(){
  const { addDoctor } = useContext(DoctorContext);
  const [form, setForm] = useState({name:"",email:"",password:"",specialization:"",licenseNumber:"",phone:""});
  const nav = useNavigate();
  const submit = (e)=>{
    e.preventDefault();
    addDoctor({...form, createdBy: "admin@cephaloai.com"});
    nav("/admin/manage-doctors");
  };
  return (
    <main className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Create Doctor</h2>
      <form onSubmit={submit} className="bg-white p-4 rounded shadow space-y-3">
        <input required placeholder="Name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} className="w-full border p-2 rounded"/>
        <input required type="email" placeholder="Email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} className="w-full border p-2 rounded"/>
        <input required type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} className="w-full border p-2 rounded"/>
        <input placeholder="Specialization" value={form.specialization} onChange={e=>setForm({...form,specialization:e.target.value})} className="w-full border p-2 rounded"/>
        <input placeholder="License Number" value={form.licenseNumber} onChange={e=>setForm({...form,licenseNumber:e.target.value})} className="w-full border p-2 rounded"/>
        <input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} className="w-full border p-2 rounded"/>
        <div className="flex justify-end">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded">Create</button>
        </div>
      </form>
    </main>
  );
}