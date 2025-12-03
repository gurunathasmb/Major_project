// filepath: C:\Users\mohit\Desktop\Major project\src\components\doctor\Classification.js

import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PatientContext } from "../../context/PatientContext";

export default function Classification() {

  const { cephalogramId } = useParams();
  const { getCephalogramById, updateCephalogramAnalysis } = useContext(PatientContext);
  const ceph = getCephalogramById(cephalogramId);

  const [analysis, setAnalysis] = useState(ceph?.analysis || null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ceph) return;

    // If analysis already exists → use it
    if (ceph.analysis) {
      setAnalysis(ceph.analysis);
      return;
    }

    // Fetch from backend
    async function fetchAnalysis() {
      setLoading(true);
      try {
        const response = await fetch("http://localhost:8000/api/ceph/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ cephId: ceph.id })
        });

        const backendData = await response.json();
        console.log("BACKEND ANALYSIS:", backendData);

        setAnalysis(backendData);

        // Save into global PatientContext
        updateCephalogramAnalysis(ceph.id, backendData);

      } catch (err) {
        console.error("❌ Error fetching classification:", err);
      }
      setLoading(false);
    }

    fetchAnalysis();
  }, [ceph]);

  if (!ceph) return <div className="p-6">Cephalogram not found</div>;

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <h2 className="text-xl font-semibold mb-4">
        Classification - {ceph.fileName}
      </h2>

      {loading && (
        <div className="text-gray-500">Processing angles & classification...</div>
      )}

      {!loading && analysis && (
        <>
          {/* ================= ANGLES CARD ================= */}
          <div className="bg-white p-5 rounded shadow">
            <h3 className="font-semibold mb-3 text-lg">Cephalometric Angles</h3>
            <ul className="text-gray-700 space-y-1 text-sm">
              {Object.entries(analysis.angles).map(([key, value]) => (
                <li key={key}>
                  <strong>{key}:</strong> {value.toFixed(2)}°
                </li>
              ))}
            </ul>
          </div>

          {/* ================= SKELETAL CLASS ================= */}
          <div className="bg-white p-5 rounded shadow">
            <h3 className="font-semibold mb-3 text-lg">Skeletal Classification (ANB-Based)</h3>
            <div className="p-3 rounded bg-indigo-50 text-indigo-700 font-medium">
              {analysis.skeletal_class}
            </div>
          </div>

          {/* ================= Airway Mandible ================= */}
          <div className="bg-white p-5 rounded shadow">
            <h3 className="font-semibold mb-3 text-lg">Airway–Mandible Status</h3>
            <div
              className={`p-3 rounded font-medium ${
                analysis.airwayMandible === "Normal"
                  ? "bg-green-100 text-green-700"
                  : analysis.airwayMandible === "Restricted"
                  ? "bg-yellow-100 text-yellow-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {analysis.airwayMandible}
            </div>
          </div>

          {/* ================= Growth Pattern ================= */}
          <div className="bg-white p-5 rounded shadow">
            <h3 className="font-semibold mb-3 text-lg">Growth Pattern</h3>
            <div className="text-gray-700 font-medium">
              {analysis.growthPattern}
            </div>
          </div>

          {/* ================= DOWNLOAD REPORT ================= */}
          <div className="mt-4">
            <a
              href={analysis.excel_file}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-indigo-600 text-white rounded shadow"
            >
              Download Landmark Excel
            </a>
          </div>
        </>
      )}
    </main>
  );
}
