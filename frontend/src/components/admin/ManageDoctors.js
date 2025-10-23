// filepath: C:\Users\mohit\Desktop\Major project\src\components\admin\ManageDoctors.js
import React, { useContext } from "react";
import { DoctorContext } from "../../context/DoctorContext";

export default function ManageDoctors(){
  const { doctors, deactivateDoctor } = useContext(DoctorContext);
  return (
    <main className="max-w-4xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Manage Doctors</h2>
      <div className="bg-white rounded shadow">
        <table className="w-full text-sm">
          <thead className="text-left text-gray-600">
            <tr><th className="p-2">ID</th><th>Name</th><th>Email</th><th>Active</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {doctors.map(d=>(
              <tr key={d.id} className="border-t">
                <td className="p-2">{d.id}</td>
                <td className="p-2">{d.name}</td>
                <td className="p-2">{d.email}</td>
                <td className="p-2">{d.isActive ? "Yes" : "No"}</td>
                <td className="p-2">
                  <button disabled={!d.isActive} onClick={()=>deactivateDoctor(d.id)} className="px-2 py-1 bg-red-50 text-red-600 rounded">Deactivate</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}