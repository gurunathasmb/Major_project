import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Download, ChevronLeft, Activity, Layers, Droplet } from "lucide-react";
import { Niivue } from "@niivue/niivue";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

export default function AirwayAnalysisView() {
  const { state } = useLocation();
  const nav = useNavigate();
  const { id } = useParams();

  const [data, setData] = useState(state?.predictionData || null);
  const [loading, setLoading] = useState(!data);
  const [error, setError] = useState(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    if (!data) {
       if (!state?.predictionData) {
           setError("No 3D analysis data available. Please perform scan again.");
           setLoading(false);
       }
    }
  }, [data, state]);

  useEffect(() => {
    if (!data || !canvasRef.current) return;
    
    // NiiVue requires valid URLs. Add timestamp to bypass browser cache
    const ts = Date.now();
    const scanUrl = `${API_URL}${data.scan_nrrd_url}?t=${ts}`;
    const maskUrl = `${API_URL}${data.mask_nrrd_url}?t=${ts}`;

    // Initialize NiiVue
    const nv = new Niivue({
        isColorbar: true,
        backColor: [0.12, 0.16, 0.23, 1], // Matches #1e293b
        show3Dcrosshair: false,
    });
    
    nv.attachToCanvas(canvasRef.current);
    
    const loadVols = async () => {
        try {
            await nv.loadVolumes([
                { url: scanUrl, colormap: "bone", opacity: 0.8, visible: true },
                { url: maskUrl, colormap: "red", opacity: 1.0, visible: true }
            ]);
            nv.setSliceType(nv.sliceTypeRender); // Switch to 3D Render Mode
        } catch (err) {
            console.error("Failed to load NRRD volumes:", err);
        }
    };
    
    loadVols();

  }, [data]);

  if (loading) return <div className="p-10 flex justify-center"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
  if (error) return <div className="p-10 text-rose-500 font-bold text-center">{error}</div>;

  const pdfUrl = `${API_URL}${data.pdf_report}`;
  const metrics = data.metrics || {};

  return (
    <div className="h-full flex flex-col bg-slate-50 font-sans animate-fade-in relative z-10 p-6">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
         <div className="flex items-center gap-4">
            <button onClick={() => nav("/doctor/dashboard")} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-colors">
               <ChevronLeft size={20} />
            </button>
            <div>
               <h1 className="text-2xl font-bold text-slate-900 tracking-tight leading-none">3D Airway Analysis</h1>
               <div className="flex items-center gap-2 mt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-50 px-2 py-1 rounded-md border border-slate-100">Patient #{data.patient_id}</span>
                  <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md border border-emerald-100 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Native Volume Render</span>
               </div>
            </div>
         </div>
         <a href={pdfUrl} download target="_blank" rel="noreferrer" className="flex items-center gap-3 px-6 py-3.5 bg-indigo-600 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-indigo-100 hover:bg-slate-900 hover:scale-105 active:scale-95 transition-all">
            <Download size={16} /> Download PDF Report
         </a>
      </div>

      <div className="flex gap-6 flex-1 h-0">
         
         {/* NIIVUE 3D CANVAS */}
         <div className="flex-1 bg-[#1e293b] rounded-3xl overflow-hidden shadow-inner relative border-4 border-white">
            <div className="absolute top-6 left-6 z-10 flex items-center gap-3">
               <div className="p-3 bg-white/10 backdrop-blur-md text-white rounded-xl border border-white/20">
                  <Layers size={20} />
               </div>
               <p className="text-white font-bold text-sm tracking-wide">True NRRD Volumetric Canvas</p>
            </div>
            <div className="absolute bottom-6 left-6 right-6 z-10 flex justify-center pointer-events-none">
               <div className="px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white/70 text-xs font-bold tracking-widest uppercase flex items-center gap-2 pointer-events-auto">
                  <Activity size={14} className="text-emerald-400" />
                  Drag to rotate • Right click to pan • Scroll to zoom
               </div>
            </div>
            
            <canvas ref={canvasRef} className="w-full h-full" />
         </div>

         {/* METRICS SIDEBAR */}
         <div className="w-80 flex flex-col gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex-1">
               <div className="flex items-center gap-3 mb-8">
                  <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                     <Droplet size={18} />
                  </div>
                  <h2 className="text-sm font-bold text-slate-900 tracking-wide uppercase">Volumetric Metrics</h2>
               </div>
               
               <div className="space-y-6">
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-indigo-200 transition-colors">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Volume</p>
                     <p className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{metrics.volume_cm3} <span className="text-sm text-slate-400">cm³</span></p>
                  </div>
                  
                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-indigo-200 transition-colors">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Cross-sectional Area</p>
                     <p className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{metrics.area_mm2} <span className="text-sm text-slate-400">mm²</span></p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-indigo-200 transition-colors">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Upper Airway Width</p>
                     <p className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{metrics.upper_width_mm} <span className="text-sm text-slate-400">mm</span></p>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-indigo-200 transition-colors">
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Lower Airway Width</p>
                     <p className="text-2xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{metrics.lower_width_mm} <span className="text-sm text-slate-400">mm</span></p>
                  </div>
               </div>
            </div>

            <div className="bg-indigo-600 p-6 rounded-3xl shadow-xl shadow-indigo-100 text-white relative overflow-hidden">
               <div className="absolute -right-10 -top-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
               <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest mb-2 relative z-10">AI Classification</p>
               <h3 className="text-2xl font-bold leading-tight relative z-10">{metrics.airway_class}</h3>
            </div>
         </div>

      </div>
    </div>
  );
}
