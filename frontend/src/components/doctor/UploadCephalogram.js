// filepath: C:\Users\mohit\Desktop\Major project\src\components\doctor\UploadCephalogram.js
import React, { useState, useContext } from "react";
import { PatientContext } from "../../context/PatientContext";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function UploadCephalogram(){
  const { patients, uploadCephalogram } = useContext(PatientContext);
  const { currentUser } = useContext(AuthContext);
  const myPatients = patients.filter(p=>p.doctorId === currentUser.id);
  const [patientId, setPatientId] = useState(myPatients[0]?.id || "");
  const [fileData, setFileData] = useState(null);
  const nav = useNavigate();

  const onFile = (e)=>{
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = ()=> setFileData({fileName: f.name, imageData: reader.result});
    reader.readAsDataURL(f);
  };

  const submit = (e)=>{
    e.preventDefault();
    if (!patientId || !fileData) return alert("Select patient and file");
    const ceph = uploadCephalogram({
      patientId,
      doctorId: currentUser.id,
      fileName: fileData.fileName,
      imageData: fileData.imageData
    });
    nav(`/doctor/landmark/${ceph.id}`);
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Cephalogram</h2>
      <form onSubmit={submit} className="bg-white p-4 rounded shadow space-y-3">
        <select value={patientId} onChange={e=>setPatientId(e.target.value)} className="w-full border p-2 rounded">
          <option value="">Select patient</option>
          {myPatients.map(p=> <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
        </select>
        <input type="file" accept="image/*" onChange={onFile} className="w-full" />
        {fileData && <div className="p-2 border rounded"><img src={fileData.imageData} alt="preview" className="max-h-48"/></div>}
        <div className="flex justify-end">
          <button className="px-4 py-2 bg-indigo-600 text-white rounded">Upload</button>
        </div>
      </form>
    </main>
  );
}