import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { UploadCloud, File, AlertCircle } from "lucide-react";

export default function UploadAirway() {
  const { getAuthHeaders } = useContext(AuthContext);
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState("");
  const [fileData, setFileData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";
  const nav = useNavigate();

  // =====================================
  // FETCH PATIENTS
  // =====================================
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const res = await fetch(`${API_URL}/patients`, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) throw new Error("Failed to load patients");

        const data = await res.json();
        setPatients(data);
      } catch (err) {
        console.error(err);
        setError("Unable to fetch patients");
      }
    };

    fetchPatients();
  }, [API_URL, getAuthHeaders]);

  // =====================================
  // HANDLE FILE
  // =====================================
  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFileData({
      file: f,
      fileName: f.name,
      size: (f.size / (1024 * 1024)).toFixed(2) + " MB"
    });
  };

  // =====================================
  // SUBMIT FUNCTION
  // =====================================
  const submit = async () => {
    if (!fileData || !patientId) {
      alert("Please select a patient and upload a .nrrd or .zip file");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", fileData.file);

      const endpoint = `${API_URL}/airway-predict/${patientId}`;
      const authHeaders = getAuthHeaders();

      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: authHeaders.Authorization,
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error("Backend Error:", text);
        throw new Error("Prediction failed: " + text);
      }

      const data = await res.json();

      nav(`/doctor/airway-analysis/${data.id}`, {
        state: { predictionData: data }
      });

    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-14 px-6 flex items-center justify-center font-sans relative z-10 animate-fade-in">

      <div className="max-w-xl w-full bg-white shadow-sm border border-slate-100 rounded-3xl p-12 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center space-y-4">
             <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
             <p className="text-indigo-600 font-bold uppercase tracking-widest text-[10px]">Processing 3D Volume...</p>
             <p className="text-slate-400 text-xs text-center px-8">This may take a minute depending on file size.</p>
          </div>
        )}

        {/* HEADER */}
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-inner">
             <UploadCloud size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
            Upload 3D Scan
          </h2>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
            Select patient and upload DICOM Zip or NRRD
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-8 p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-3 text-rose-600 text-sm font-semibold">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {/* PATIENT SELECT */}
        <div className="mb-8 space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
            Target Profile
          </label>
          <select
            value={patientId}
            onChange={(e) => setPatientId(e.target.value)}
            className="w-full px-4 py-3.5 bg-slate-50 rounded-xl border border-slate-100 text-slate-900 font-semibold focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 outline-none transition-all"
          >
            <option value="">Select a patient...</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Ref: #{p.id})
              </option>
            ))}
          </select>
        </div>

        {/* FILE UPLOAD */}
        <div className="mb-10 space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">
            Volume File (.nrrd, .zip)
          </label>
          
          {!fileData ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer bg-slate-50 hover:bg-slate-100 hover:border-indigo-200 transition-all group">
               <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <File className="w-8 h-8 text-slate-400 group-hover:text-indigo-500 mb-2 transition-colors" />
                  <p className="text-sm font-semibold text-slate-500 group-hover:text-indigo-600 transition-colors">Click to browse or drag and drop</p>
               </div>
               <input type="file" accept=".nrrd,.zip" className="hidden" onChange={onFile} />
            </label>
          ) : (
            <div className="p-4 border border-slate-100 rounded-2xl bg-white flex items-center justify-between">
               <div className="flex items-center gap-4 overflow-hidden">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                     <File size={20} />
                  </div>
                  <div className="truncate">
                     <p className="font-bold text-slate-900 text-sm truncate">{fileData.fileName}</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{fileData.size}</p>
                  </div>
               </div>
               <button onClick={() => setFileData(null)} className="text-[10px] font-bold text-slate-400 hover:text-rose-500 uppercase tracking-widest p-2">
                  Remove
               </button>
            </div>
          )}
        </div>

        {/* SUBMIT BUTTON */}
        <button
            onClick={submit}
            disabled={!fileData || !patientId || loading}
            className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-[10px] transition-all shadow-xl ${
              (!fileData || !patientId) 
              ? "bg-slate-100 text-slate-400 shadow-none cursor-not-allowed" 
              : "bg-indigo-600 text-white hover:bg-slate-900 shadow-indigo-100 active:scale-[0.98]"
            }`}
        >
          Initiate 3D Analysis
        </button>

      </div>
    </div>
  );
}
