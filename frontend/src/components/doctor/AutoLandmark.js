// filepath: C:\Users\mohit\Desktop\Major project\src\components\doctor\AutoLandmark.js
import React, { useEffect, useState, useContext, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { PatientContext } from "../../context/PatientContext";
import { LANDMARKS } from "../../utils/constants";
import { randomLandmarks } from "../../utils/helpers";
import Loader from "../common/Loader";

export default function AutoLandmark(){
  const { cephalogramId } = useParams();
  const { getCephalogramById, updateCephalogramAnalysis } = useContext(PatientContext);
  const ceph = getCephalogramById(cephalogramId);
  const [analyzing, setAnalyzing] = useState(true);
  const [landmarks, setLandmarks] = useState([]);
  const imgRef = useRef();

  useEffect(()=>{
    if (!ceph) return;
    setAnalyzing(true);
    setLandmarks([]);
    // simulate 3s animation then create mock landmarks
    const t = setTimeout(()=>{
      const lm = randomLandmarks(LANDMARKS);
      setLandmarks(lm);
      setAnalyzing(false);
      // update cephalogram with landmarks (analysis filled later by classification)
      updateCephalogramAnalysis(ceph.id, lm, null);
    }, 3000);
    return ()=> clearTimeout(t);
  }, [ceph]);

  if (!ceph) return <div className="p-6">Cephalogram not found</div>;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Auto Landmark - {ceph.fileName}</h2>
        <Link className="text-indigo-600" to={`/doctor/classification/${ceph.id}`}>Go to Classification</Link>
      </div>

      <div className="bg-white p-4 rounded shadow">
        {analyzing ? (
          <div className="flex flex-col items-center gap-3">
            <Loader />
            <div className="text-gray-600">Analyzing... Detecting landmarks...</div>
          </div>
        ) : null}

        <div className="mt-4 relative w-full flex justify-center">
          <img ref={imgRef} src={ceph.imageData} alt={ceph.fileName} className="max-w-full h-auto border" />
          {/* Overlay points positioned by percentage */}
          {landmarks.map((lm, idx)=>(
            <div key={lm.name} style={{
              position: 'absolute',
              left: `${lm.xPercent}%`,
              top: `${lm.yPercent}%`,
              transform: 'translate(-50%,-50%)'
            }} className="flex flex-col items-center pointer-events-none">
              <div className="w-3 h-3 bg-red-600 rounded-full border-2 border-white"></div>
              <div className="text-xs text-red-700 bg-white/80 px-1 rounded mt-1">{lm.name}</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}