// filepath: C:\Users\mohit\Desktop\Major project\src\components\doctor\Classification.js
import React, { useContext, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PatientContext } from "../../context/PatientContext";
import { mockAnalysis } from "../../utils/helpers";

export default function Classification(){
  const { cephalogramId } = useParams();
  const { getCephalogramById, updateCephalogramAnalysis } = useContext(PatientContext);
  const ceph = getCephalogramById(cephalogramId);
  const [analysis, setAnalysis] = useState(ceph?.analysis || null);

  useEffect(()=>{
    if (!ceph) return;
    if (ceph.analysis) {
      setAnalysis(ceph.analysis);
      return;
    }
    // create mock analysis and update
    const a = mockAnalysis();
    setAnalysis(a);
    updateCephalogramAnalysis(ceph.id, ceph.landmarks || [], a);
  }, [ceph]);

  if (!ceph) return <div className="p-6">Cephalogram not found</div>;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Classification - {ceph.fileName}</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Cephalometric Angles</h3>
          {analysis ? (
            <ul className="text-sm text-gray-700 space-y-1">
              {Object.entries(analysis.angles).map(([k,v])=>(
                <li key={k}><strong>{k}:</strong> {v}°</li>
              ))}
            </ul>
          ) : <div className="text-gray-500">Calculating...</div>}
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Airway-Mandible</h3>
          {analysis ? (
            <div className={`p-3 rounded ${analysis.airwayMandible==="Normal" ? "bg-green-50 text-green-700" : analysis.airwayMandible==="Restricted" ? "bg-yellow-50 text-yellow-700" : "bg-red-50 text-red-700"}`}>
              {analysis.airwayMandible}
            </div>
          ) : <div className="text-gray-500">Calculating...</div>}
        </div>

        <div className="bg-white p-4 rounded shadow">
          <h3 className="font-medium mb-2">Growth Pattern</h3>
          {analysis ? (
            <div className="text-gray-700">{analysis.growthPattern}</div>
          ) : <div className="text-gray-500">Calculating...</div>}
        </div>
      </div>

      <div className="mt-4">
        <button onClick={()=>alert("Download report (mock)")} className="px-4 py-2 bg-indigo-600 text-white rounded">Download Report</button>
      </div>
    </main>
  );
}