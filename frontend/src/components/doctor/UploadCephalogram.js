import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import CephalogramViewer from "./CephalogramViewer";

export default function UploadCephalogram() {
  const { getAuthHeaders } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState("");
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [latestPredictionId, setLatestPredictionId] = useState(null);

  const API_URL = "http://localhost:8000";
  const nav = useNavigate();

  useEffect(() => {
    fetch(`${API_URL}/patients`, { headers: getAuthHeaders() })
      .then((res) => res.json())
      .then(setPatients)
      .catch(console.error);
  }, []);

  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;

    const reader = new FileReader();
    reader.onload = () =>
      setFileData({
        file: f,
        fileName: f.name,
        imageData: reader.result,
      });
    reader.readAsDataURL(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!fileData || !patientId)
      return alert("Select patient and upload image");

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", fileData.file);

      const res = await fetch(`${API_URL}/predict/${patientId}`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: formData,
      });

      if (!res.ok) throw new Error("Prediction failed");

      const data = await res.json();
      setLatestPredictionId(data.id);

      nav(`/doctor/landmark/${data.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Upload Cephalogram</h2>

      <form onSubmit={submit} className="bg-white p-4 rounded shadow space-y-3">
        <select
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="">Select patient</option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} (#{p.id})
            </option>
          ))}
        </select>

        <input type="file" accept="image/*" onChange={onFile} />

        {fileData && (
          <div className="p-2 border rounded">
            <img src={fileData.imageData} className="max-h-48 mx-auto" alt="" />
          </div>
        )}

        {error && <div className="text-red-500">{error}</div>}

        <button
          disabled={loading}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
        >
          {loading ? "Processing..." : "Upload & Predict"}
        </button>
      </form>

      {/* Auto-show Prediction */}
      {latestPredictionId && (
        <div className="mt-10">
          <h3 className="text-lg font-semibold">Prediction Output</h3>
          <CephalogramViewer predictionId={latestPredictionId} />
        </div>
      )}
    </main>
  );
}
