// filepath: src/components/doctor/DoctorDashboard.js
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { Link } from "react-router-dom";

export default function DoctorDashboard() {
  const { currentUser, token } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = "http://localhost:8000"; // ⚙️ backend base URL

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/patients`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.detail || "Failed to fetch patients");
        }
        const data = await res.json();
        setPatients(data);
      } catch (err) {
        console.error("Error fetching patients:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchPatients();
  }, [token]);

  return (
    <main className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Doctor Dashboard</h1>

      {loading && <div className="text-gray-500">Loading patients...</div>}
      {error && <div className="text-red-500">Error: {error}</div>}

      {!loading && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Patients Section */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-medium mb-2">My Patients</h3>
            {patients.length === 0 ? (
              <div className="text-gray-500">No patients yet</div>
            ) : (
              <ul className="space-y-2">
                {patients.map((p) => (
                  <li
                    key={p.id}
                    className="flex justify-between items-center border-b border-gray-100 pb-1"
                  >
                    <span>{p.name}</span>
                    <span className="text-xs text-gray-500">
                      {new Date(p.created_at).toLocaleDateString()}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-3">
              <Link
                className="text-indigo-600 hover:text-indigo-800"
                to="/doctor/create-patient"
              >
                + Create New Patient
              </Link>
            </div>
          </div>

          {/* Placeholder for Cephalograms Section (extend later) */}
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-medium mb-2">Recent Cephalograms</h3>
            <div className="text-gray-500">
              Integration pending – will show uploads after backend `/predict` connection.
            </div>
            <div className="mt-3">
              <Link
                className="text-indigo-600 hover:text-indigo-800"
                to="/doctor/upload-cephalogram"
              >
                Upload Cephalogram
              </Link>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
