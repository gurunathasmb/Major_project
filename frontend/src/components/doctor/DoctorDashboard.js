// filepath: C:\Users\mohit\Desktop\Major project\src\components\doctor\DoctorDashboard.js
import React, { useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { PatientContext } from "../../context/PatientContext";
import { Link } from "react-router-dom";

export default function DoctorDashboard(){
  const { currentUser } = useContext(AuthContext);
  const { patients, cephalograms } = useContext(PatientContext);
  const myPatients = patients.filter(p=>p.doctorId === currentUser?.id);
  const myCephs = cephalograms.filter(c=>c.doctorId === currentUser?.id);

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Doctor Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">My Patients</h3>
          {myPatients.length===0 ? <div className="text-gray-500">No patients yet</div> : (
            <ul className="space-y-2">
              {myPatients.map(p=> <li key={p.id} className="flex justify-between"><span>{p.name}</span><span className="text-xs text-gray-500">{p.id}</span></li>)}
            </ul>
          )}
          <div className="mt-3">
            <Link className="text-indigo-600" to="/doctor/create-patient">Create Patient</Link>
          </div>
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Recent Cephalograms</h3>
          {myCephs.length===0 ? <div className="text-gray-500">No uploads yet</div> : (
            <ul className="space-y-2">
              {myCephs.slice().reverse().slice(0,5).map(c=> <li key={c.id} className="flex justify-between"><span>{c.fileName}</span><span className="text-xs text-gray-500">{c.status}</span></li>)}
            </ul>
          )}
          <div className="mt-3">
            <Link className="text-indigo-600" to="/doctor/upload-cephalogram">Upload Cephalogram</Link>
          </div>
        </div>
      </div>
    </main>
  );
}