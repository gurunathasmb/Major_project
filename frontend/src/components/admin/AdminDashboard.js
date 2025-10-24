// filepath: C:\Users\mohit\Desktop\Major project\src\components\admin\AdminDashboard.js
import React, { useContext } from "react";
import { DoctorContext } from "../../context/DoctorContext";
import { PatientContext } from "../../context/PatientContext";
import StatCard from "../common/StatCard";
import { User, Activity, FileText } from "lucide-react";

export default function AdminDashboard(){
  const { doctors } = useContext(DoctorContext);
  const { patients, cephalograms } = useContext(PatientContext);

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard title="Doctors" value={doctors.length} icon={<User />} />
        <StatCard title="Patients" value={patients.length} icon={<Activity />} />
        <StatCard title="Cephalograms" value={cephalograms.length} icon={<FileText />} />
      </div>

      <section className="bg-white rounded shadow p-4">
        <h2 className="text-lg font-medium mb-2">All Patients</h2>
        {patients.length===0 ? (
          <div className="text-gray-500 p-6">No patients yet...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-gray-600">
                <tr><th className="p-2">ID</th><th>Name</th><th>Doctor</th><th>Age</th></tr>
              </thead>
              <tbody>
                {patients.map(p=>(
                  <tr key={p.id} className="border-t">
                    <td className="p-2">{p.id}</td>
                    <td className="p-2">{p.name}</td>
                    <td className="p-2">{p.doctorName}</td>
                    <td className="p-2">{p.age}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}