import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { 
  Edit, Trash2, X, AlertCircle, Search, Plus, Calendar, 
  Microscope, ChevronRight, Activity, User, FileText, Cpu, QrCode 
} from "lucide-react";
import QRScanner from "../common/QRScanner";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function DoctorDashboard({ searchTerm, setSearchTerm }) {
  const { profile, getAuthHeaders } = useContext(AuthContext);
  const navigate = useNavigate();

  // Core State
  const [patients, setPatients] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [loading, setLoading] = useState(true);

  // Deletion logic
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Edit Patient logic
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ name: "", dob: "", notes: "" });

  // QR Scanner logic
  const [showQRModal, setShowQRModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = getAuthHeaders();
        const [patientsRes, predictionsRes] = await Promise.all([
          fetch(`${API_URL}/patients/`, { headers }), 
          fetch(`${API_URL}/doctor/predictions`, { headers }),
        ]);

        if (patientsRes.ok) {
          const pData = await patientsRes.json();
          setPatients(pData || []);
        }
        if (predictionsRes.ok) {
          const prData = await predictionsRes.json();
          setPredictions(prData || []);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [getAuthHeaders]);

  const filteredPatients = patients.filter(p => {
    if (!searchTerm.trim()) return true;
    const name = p.name || "";
    return name.toLowerCase().includes(searchTerm.trim().toLowerCase());
  });

  const filteredPredictions = selectedPatient 
    ? predictions.filter(pr => pr.patient_id === selectedPatient.id) 
    : [];

  const handleEditPatient = (p) => {
    setPatientToDelete(p);
    setEditData({ name: p.name, dob: p.dob || "", notes: p.notes || "" });
    setShowEditModal(true);
  };

  const submitEdit = async () => {
    try {
      const res = await fetch(`${API_URL}/patients/${patientToDelete.id}`, {
        method: "PUT",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (res.ok) {
        const updated = await res.json();
        setPatients(patients.map(p => p.id === updated.id ? updated : p));
        setShowEditModal(false);
      }
    } catch (err) { console.error(err); }
  };

  const requestDeleteOtp = async (patient) => {
    setPatientToDelete(patient);
    setShowDeleteModal(true);
    try {
      const res = await fetch(`${API_URL}/patients/${patient.id}/send-delete-code`, {
        method: "POST", headers: getAuthHeaders()
      });
      if (res.ok) setOtpSent(true);
    } catch (err) { console.error(err); }
  };

  const confirmDelete = async () => {
    setVerifying(true);
    try {
      const res = await fetch(`${API_URL}/patients/${patientToDelete.id}?code=${verificationCode}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        setPatients(patients.filter(p => p.id !== patientToDelete.id));
        setShowDeleteModal(false);
        setPatientToDelete(null);
        setSelectedPatient(null);
        setVerificationCode("");
        setOtpSent(false);
      } else {
        alert("Wrong code. Please try again.");
      }
    } catch (err) { console.error(err); }
    finally { setVerifying(false); }
  };

  const handleScanSuccess = (decodedText) => {
    setShowQRModal(false);
    let patientId = null;
    if (/^\d+$/.test(decodedText)) patientId = parseInt(decodedText);
    else {
      const match = decodedText.match(/\/patient-history\/(\d+)/);
      if (match) patientId = parseInt(match[1]);
    }

    if (patientId) {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        setSelectedPatient(patient);
        setSearchTerm(""); 
      } else alert(`Patient with ID ${patientId} not found.`);
    } else alert("Invalid QR code format.");
  };

  if (loading) return (
    <div className="flex flex-col h-full items-center justify-center text-slate-400 font-bold space-y-4">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="uppercase tracking-widest text-[10px]">Synchronizing Registry...</p>
    </div>
  );

  return (
    <div className="flex h-full bg-[#fcfdfe] gap-6 animate-fade-in relative z-10 font-sans p-6">
      
      {/* SIDEBAR: PATIENT LIST */}
      <div className="w-80 bg-white border border-slate-100 rounded-2xl shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-50 space-y-4 bg-white shrink-0">
          <div className="flex items-center justify-between">
             <h2 className="text-xl font-bold text-slate-900 tracking-tight">Patient List</h2>
             <div className="flex gap-2">
                <button onClick={() => setShowQRModal(true)} className="w-9 h-9 bg-slate-100 text-slate-600 rounded-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all active:scale-90" title="QR Scan">
                    <QrCode size={18} />
                </button>
                <button onClick={() => navigate("/doctor/create-patient")} className="w-9 h-9 bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-slate-900 transition-all active:scale-90 shadow-lg shadow-indigo-100">
                    <Plus size={18} />
                </button>
             </div>
          </div>
          <div className="relative group">
            <Search className="absolute left-3.5 top-2.5 text-slate-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
            <input
              type="text"
              placeholder="Search patients..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-100 rounded-xl text-sm font-semibold focus:outline-none focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all text-slate-900 placeholder-slate-300"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5 custom-scrollbar bg-white">
          {filteredPatients.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedPatient(p)}
              className={`p-4 rounded-xl cursor-pointer transition-all border ${selectedPatient?.id === p.id ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-white border-transparent hover:bg-slate-50 text-slate-500 hover:text-slate-900'}`}
            >
              <div className="font-bold text-[15px] leading-tight mb-1">{p.name || "Unnamed Patient"}</div>
              <div className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${selectedPatient?.id === p.id ? 'text-indigo-400' : 'text-slate-300'}`}>
                <Calendar size={12} /> Registered: {new Date(p.created_at).toLocaleDateString()}
              </div>
            </div>
          ))}
          {filteredPatients.length === 0 && (
             <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-200">
                   <User size={24} />
                </div>
                <p className="text-slate-300 font-bold text-[10px] uppercase tracking-widest">No entries found.</p>
             </div>
          )}
        </div>
      </div>

      {/* MAIN VIEW: PATIENT INFORMATION */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {selectedPatient ? (
          <div className="space-y-6 pb-20">
            
            <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center transition-all">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-indigo-100 uppercase">
                   {selectedPatient.name?.charAt(0) || "P"}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-2">{selectedPatient.name}</h1>
                  <div className="flex items-center gap-3">
                     <span className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-wider"><Calendar size={12} className="text-indigo-600"/> DOB: {selectedPatient.dob || "Unknown"}</span>
                     <span className="flex items-center gap-2 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 text-indigo-700 text-[10px] font-bold leading-none uppercase tracking-wider">REF: #{selectedPatient.id}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                 <button onClick={() => handleEditPatient(selectedPatient)} className="p-3 bg-white text-slate-400 rounded-xl border border-slate-100 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 transition-all shadow-sm active:scale-95">
                    <Edit size={18} />
                 </button>
                 <button onClick={() => requestDeleteOtp(selectedPatient)} className="p-3 bg-rose-50 text-rose-600 rounded-xl border border-rose-100 hover:bg-rose-600 hover:text-white transition-all shadow-sm active:scale-95">
                    <Trash2 size={18} />
                 </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
               <button onClick={() => navigate("/doctor/upload-cephalogram")} className="flex items-center gap-6 p-6 bg-white border border-slate-100 rounded-2xl shadow-sm hover:translate-y-[-2px] transition-all group">
                  <div className="p-5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-100 group-hover:scale-105 transition-transform">
                     <FileText size={28} />
                  </div>
                  <div className="text-left">
                     <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">New AI Scan</h3>
                     <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest group-hover:text-indigo-600">Initiate automated analysis</p>
                  </div>
               </button>
               <button onClick={() => navigate("/doctor/upload-airway")} className="p-6 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center gap-6 group hover:translate-y-[-2px] transition-all cursor-pointer">
                  <div className="p-5 bg-emerald-50 text-emerald-600 rounded-xl shadow-inner transition-transform group-hover:rotate-12 group-hover:bg-emerald-600 group-hover:text-white">
                     <Activity size={28} />
                  </div>
                  <div className="text-left">
                     <h3 className="text-lg font-bold text-slate-900 leading-tight mb-1">Clinic Sync</h3>
                     <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> 3D Airway Analysis
                     </p>
                  </div>
               </button>
            </div>

            <div className="space-y-4 pt-2">
              <h2 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-4 flex items-center gap-6 leading-none">
                Clinical Reports <span className="h-px bg-slate-100 flex-1"></span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPredictions.map((pr) => (
                  <div key={pr.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-5 group hover:border-indigo-600 transition-all cursor-pointer active:scale-95" onClick={() => navigate(`/doctor/classification/${pr.id}`)}>
                    <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                       <Cpu size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-base mb-1">Diagnostic Report</h4>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                         View Details <ChevronRight size={12} />
                      </p>
                    </div>
                  </div>
                ))}
                {filteredPredictions.length === 0 && (
                  <div className="col-span-full py-20 text-center bg-slate-50/50 rounded-2xl border-dashed border-slate-200 border-2">
                    <Microscope size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] italic">No active reports for this profile.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-100 rounded-2xl h-full flex flex-col items-center justify-center p-12 text-center space-y-8 animate-fade-in shadow-sm">
            <div className="w-24 h-24 bg-slate-50 border border-slate-100 text-slate-200 rounded-2xl flex items-center justify-center shadow-inner">
               <User size={48} />
            </div>
            <div className="space-y-3">
               <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Select Patient</h2>
               <p className="text-slate-400 font-medium max-w-[280px] uppercase text-[10px] tracking-widest leading-loose">Choose a profile from the sidebar to manage clinical records and scans.</p>
            </div>
          </div>
        )}
      </div>

      {/* MODALS (Simplified Rounding) */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-2xl border border-slate-100 space-y-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-xl mx-auto flex items-center justify-center border border-rose-100">
                <AlertCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Confirm Removal</h2>
              <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Target: <span className="text-slate-900 block mt-2 text-xl">{patientToDelete?.name}</span></p>
            </div>
            {otpSent && (
              <input type="text" placeholder="Security Code" className="w-full text-center text-3xl font-bold tracking-widest py-4 bg-slate-50 border border-slate-100 rounded-xl focus:outline-none focus:border-indigo-600 transition-all text-indigo-600" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} />
            )}
            <div className="flex gap-4">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-4 bg-slate-50 text-slate-500 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-100 transition-all">Cancel</button>
              {otpSent && (
                <button onClick={confirmDelete} disabled={verifying} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-900 shadow-xl shadow-indigo-100">{verifying ? "..." : "Confirm"}</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
           <div className="bg-white rounded-2xl p-10 max-w-md w-full shadow-2xl space-y-8">
              <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold text-slate-900 tracking-tight">Edit Profile</h2>
                 <button onClick={() => setShowEditModal(false)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors bg-slate-50 rounded-lg"><X size={20} /></button>
              </div>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Full Name</label>
                    <input type="text" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 text-sm focus:ring-4 focus:ring-indigo-50 transition-all"/>
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Date of Birth</label>
                    <input type="date" value={editData.dob} onChange={e => setEditData({...editData, dob: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-900 text-sm focus:ring-4 focus:ring-indigo-50 transition-all"/>
                 </div>
                 <button onClick={submitEdit} className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-900 transition-all shadow-xl shadow-indigo-100">Save Changes</button>
              </div>
           </div>
        </div>
      )}

      {showQRModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
           <div className="bg-white rounded-3xl p-10 max-w-md w-full shadow-2xl space-y-6 text-center">
              <div className="flex justify-between items-center text-left">
                 <div>
                    <h2 className="text-xl font-bold text-slate-900 tracking-tight leading-none">Clinical Scan</h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5 leading-none">Retrieve patient via QR...</p>
                 </div>
                 <button onClick={() => setShowQRModal(false)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors bg-slate-50 rounded-lg"><X size={20} /></button>
              </div>
              <div className="py-2 overflow-hidden rounded-2xl border border-slate-100">
                <QRScanner onScanSuccess={handleScanSuccess} onScanError={(err) => console.log(err)} />
              </div>
              <button onClick={() => setShowQRModal(false)} className="w-full py-4 bg-slate-100 text-slate-400 rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-slate-200 transition-all">Cancel</button>
           </div>
        </div>
      )}
    </div>
  );
}