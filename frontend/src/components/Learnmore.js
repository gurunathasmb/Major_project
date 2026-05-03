import React, { useState, useEffect, useRef } from "react";
import { 
  Cpu, ShieldCheck, Zap, Activity, 
  ArrowRight, CheckCircle2, Laptop, Smartphone,
  BarChart3, Layers, FileText, Share2, ClipboardList
} from "lucide-react";
import { useNavigate } from "react-router-dom";

function ScrollReveal({ children }) {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = useRef();

  useEffect(() => {
    const currentRef = domRef.current;
    if (!currentRef) return;
    
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        setIsVisible(entry.isIntersecting);
      });
    }, { threshold: 0.15 });
    
    observer.observe(currentRef);
    return () => observer.unobserve(currentRef);
  }, []);

  return (
    <div
      ref={domRef}
      className={`transition-all duration-1000 transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
      }`}
    >
      {children}
    </div>
  );
}

function TypewriterText({ text, delay = 50, onComplete, showCursor = false }) {
  const [currentText, setCurrentText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      // Add slight randomness to typing speed for a natural feel
      const randomDelay = delay + (Math.random() * 30 - 15);
      const timeout = setTimeout(() => {
        setCurrentText(prev => prev + text[currentIndex]);
        setCurrentIndex(c => c + 1);
      }, randomDelay);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, delay]);

  useEffect(() => {
    if (currentIndex === text.length && onComplete) {
      onComplete();
    }
  }, [currentIndex, text.length, onComplete]);

  return (
    <>
      {currentText}
      {showCursor && (
        <span className="inline-block animate-pulse font-light ml-1 opacity-80 text-cyan-400">|</span>
      )}
    </>
  );
}

function LoadingScreen({ onComplete }) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(onComplete, 800);
    }, 2500); // 2.5 seconds loading
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050a1a] transition-opacity duration-700 ${fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      <div className="absolute inset-0 flex items-center justify-center overflow-hidden pointer-events-none">
        <div className="w-[40rem] h-[40rem] bg-cyan-500/5 blur-[100px] rounded-full animate-pulse"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center px-6">
        <div className="w-20 h-20 mb-10 relative flex items-center justify-center">
           <div className="absolute inset-0 border-t-2 border-b-2 border-cyan-500 rounded-full animate-spin"></div>
           <div className="absolute inset-3 border-l-2 border-r-2 border-indigo-500 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
           <Activity className="text-cyan-400 animate-pulse" size={32} />
        </div>
        
        <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-xs font-black uppercase tracking-[0.4em] text-indigo-400 mb-6 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
           Team 2
        </div>
        
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-wide mb-6 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 drop-shadow-lg">
           AI-Based Landmark Detection
        </h2>
        <p className="text-slate-500 font-bold text-xs md:text-sm max-w-lg uppercase tracking-[0.3em] animate-pulse">
           Initializing Intelligence Engine...
        </p>
      </div>
    </div>
  );
}

function HeroTitle({ startTyping }) {
  const part1 = "AI-Based Landmark Detection";
  const part2 = "for Correlation of Upper Pharyngeal\nAirway and Mandibular Position";
  
  const [showPart2, setShowPart2] = useState(false);
  const [done, setDone] = useState(false);

  return (
    <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-wide leading-[1.3] mb-8 min-h-[160px] md:min-h-[220px]">
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">
        {startTyping && <TypewriterText text={part1} delay={55} onComplete={() => setShowPart2(true)} showCursor={!showPart2} />}
      </span><br/>
      {showPart2 && (
        <span className="text-3xl md:text-5xl lg:text-6xl mt-6 block whitespace-pre-line text-slate-200 leading-[1.4]">
           <TypewriterText text={part2} delay={35} onComplete={() => setDone(true)} showCursor={!done} />
        </span>
      )}
    </h1>
  );
}

export default function Learnmore() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      {isLoading && <LoadingScreen onComplete={() => setIsLoading(false)} />}
      
      <div className={`h-screen bg-transparent text-white font-sans overflow-x-hidden overflow-y-auto scroll-smooth snap-y snap-mandatory transition-opacity duration-1000 ${isLoading ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
        
      {/* 1. HERO SECTION */}
      <section className="relative w-full min-h-screen flex flex-col items-center justify-center snap-start pt-24 pb-20 px-6 max-w-7xl mx-auto text-center animate-fade-in">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-400 mb-8 backdrop-blur-md">
           <Smartphone size={12} className="inline md:hidden" />
           <Laptop size={12} className="hidden md:inline" />
           Clinical Intelligence Engine
        </div>
        
        <HeroTitle startTyping={!isLoading} />
        
        <p className="max-w-2xl mx-auto text-slate-400 text-lg md:text-xl font-medium leading-relaxed mb-12">
          Automated landmark detection, classification, & clinical insights. Engineered for the modern orthodontic practice.
        </p>

        <div className="flex flex-col sm:flex-row gap-5 justify-center mb-16">
          <button onClick={() => navigate("/login")} className="px-10 py-4 bg-cyan-500 text-[#050a1a] rounded-lg font-bold text-sm hover:bg-white transition-all shadow-lg shadow-cyan-500/20 active:scale-95">
            Get Started
          </button>
          <button onClick={() => navigate("/login")} className="px-10 py-4 bg-white/5 border border-white/10 rounded-lg font-bold text-sm hover:bg-white/10 transition-all backdrop-blur-md active:scale-95">
            Login to Portal
          </button>
        </div>

      </section>

      {/* 1.5. INTRODUCTION & PROJECT DETAILS */}
      <section className="w-full min-h-screen flex flex-col justify-center snap-start py-24 px-6 max-w-7xl mx-auto border-t border-white/5 overflow-hidden">
        <ScrollReveal>
         <div className="text-center mb-16">
            <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-[0.3em] mb-4">Project Overview</h2>
            <h3 className="text-3xl md:text-5xl font-bold tracking-tight leading-[1.2] mb-6">Research Abstract</h3>
         </div>
         <div className="max-w-4xl mx-auto text-slate-400 text-lg font-medium leading-relaxed space-y-6 text-justify">
            <p>
              This project presents a deep learning-based framework for automated cephalometric landmark detection and quantitative correlation analysis between upper pharyngeal airway dimensions and mandibular position in orthodontic patients.
            </p>
            <p>
              Traditional cephalometric analysis relies on manual landmark identification—a time-intensive process subject to inter-observer variability. Our proposed system integrates three complementary deep learning modules: a heatmap-based U-Net architecture for 11-landmark detection, a segmentation-guided custom regressor CNN for 19-landmark detection, and a 3D U-Net segmentation module for pharyngeal airway area measurement.
            </p>
            <p>
              The automated system reduces per-radiograph analysis time from 60–90 minutes to under 30 seconds while approaching expert-level accuracy, establishing a scalable framework for population-level airway-morphology studies and clinical decision support.
            </p>
         </div>
        </ScrollReveal>
      </section>

      {/* 1.6. TEAM SECTION */}
      <section className="w-full min-h-screen flex flex-col justify-center snap-start py-24 bg-white/[0.01] border-y border-white/5 backdrop-blur-sm overflow-hidden">
        <ScrollReveal>
         <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-[0.3em] mb-4">Our Team</h2>
            <h3 className="text-4xl md:text-5xl font-bold tracking-tight mb-16">Project Members</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10 mb-24">
               {[
                 { name: "Abhay Vijay Goudar", usn: "1DS22AI001", image: "/images/abhay.jpeg", role: "Team Member" },
                 { name: "Gurunathagouda M Biradar", usn: "1DS22AI016", image: "/images/gurunathagouda.png", role: "Team Member" },
                 { name: "Mohith Anand", usn: "1DS22AI024", image: "/images/mohit.jpeg", role: "Team Member" },
                 { name: "Pratham Bhat", usn: "1DS22AI031", image: "/images/pratham.jpeg", role: "Team Member" }
               ].map((item, idx) => (
                  <div key={`member-${idx}`} className="flex flex-col items-center">
                     <div className="w-52 h-52 md:w-56 md:h-56 rounded-full border border-cyan-500/30 overflow-hidden mb-6 group hover:border-cyan-400 transition-all shadow-lg shadow-cyan-500/10 bg-[#0a0f1c] flex items-center justify-center relative">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 z-10" 
                          onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23111827'/%3E%3Ctext x='50%25' y='50%25' fill='%234b5563' font-family='sans-serif' font-size='14' text-anchor='middle' alignment-baseline='middle'%3E${item.name.split(' ')[0]}%3C/text%3E%3C/svg%3E`; 
                          }} 
                        />
                     </div>
                     <h4 className="text-xl font-bold text-white mb-1 leading-tight">{item.name}</h4>
                     <p className="text-sm text-cyan-400 font-bold mb-1">{item.usn}</p>
                     <p className="text-xs text-slate-400 font-medium">{item.role}</p>
                  </div>
               ))}
            </div>
         </div>
        </ScrollReveal>
      </section>

      {/* 1.6.5. GUIDES SECTION */}
      <section className="w-full min-h-screen flex flex-col justify-center snap-start py-24 bg-white/[0.01] border-b border-white/5 backdrop-blur-sm overflow-hidden">
        <ScrollReveal>
         <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-sm font-bold text-indigo-400 uppercase tracking-[0.3em] mb-4">Mentorship</h2>
            <h3 className="text-4xl md:text-5xl font-bold tracking-tight mb-16">Our Guides</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-10">
               {[
                 { name: "Prof. Ramya K", desc: "Main Guide", image: "/images/ramya.jpeg" },
                 { name: "Mr. Suraj Kumar", desc: "Software Developer, Co-Guide", image: "/images/suraj.jpeg" },
                 { name: "Dr. Vindhya Malagi", desc: "Head of Department", image: "/images/hod mam.jpg" },
                 { name: "Dr. Prachi", desc: "PG Student, Dental Orthodontics", image: "/images/prachi.jpg.jpeg" }
               ].map((item, idx) => (
                  <div key={`guide-${idx}`} className="flex flex-col items-center">
                     <div className="w-52 h-52 md:w-56 md:h-56 rounded-full border border-indigo-500/30 overflow-hidden mb-6 group hover:border-indigo-400 transition-all shadow-lg shadow-indigo-500/10 bg-[#0a0f1c] flex items-center justify-center relative">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="absolute inset-0 w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-all duration-500 z-10" 
                          onError={(e) => { 
                            e.target.onerror = null; 
                            e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100%25' height='100%25'%3E%3Crect width='100%25' height='100%25' fill='%23111827'/%3E%3Ctext x='50%25' y='50%25' fill='%234b5563' font-family='sans-serif' font-size='14' text-anchor='middle' alignment-baseline='middle'%3E${item.name.split(' ')[0]}%3C/text%3E%3C/svg%3E`; 
                          }} 
                        />
                     </div>
                     <h4 className="text-xl font-bold text-white mb-1 leading-tight">{item.name}</h4>
                     <p className="text-sm text-indigo-400 font-medium">{item.desc}</p>
                  </div>
               ))}
            </div>
         </div>
        </ScrollReveal>
      </section>

      {/* 1.7. SDG SECTION */}
      <section className="w-full min-h-screen flex flex-col justify-center snap-start py-24 px-6 max-w-7xl mx-auto text-center overflow-hidden">
        <ScrollReveal>
         <div className="mb-16">
            <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-[0.3em] mb-4">Impact</h2>
            <h3 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">Sustainable Development Goals</h3>
            <p className="max-w-2xl mx-auto text-slate-400 text-lg font-medium">
               Our project aligns with the United Nations SDGs by improving healthcare accessibility, fostering innovation in medical technology, and ensuring better quality of life through advanced diagnostics.
            </p>
         </div>
         <div className="flex flex-wrap justify-center gap-8">
            <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-md max-w-xs hover:border-cyan-500/30 hover:bg-cyan-500/5 transition-all cursor-default">
               <div className="text-5xl mb-6">🏥</div>
               <h4 className="text-xl font-bold text-white mb-3">SDG 3</h4>
               <p className="text-sm text-slate-400 leading-relaxed">Good Health and Well-being: Ensuring healthy lives and promoting well-being for all at all ages through precision diagnostics.</p>
            </div>
            <div className="p-8 rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-md max-w-xs hover:border-indigo-500/30 hover:bg-indigo-500/5 transition-all cursor-default">
               <div className="text-5xl mb-6">⚙️</div>
               <h4 className="text-xl font-bold text-white mb-3">SDG 9</h4>
               <p className="text-sm text-slate-400 leading-relaxed">Industry, Innovation and Infrastructure: Building resilient infrastructure and fostering technological innovation in healthcare.</p>
            </div>
         </div>
        </ScrollReveal>
      </section>

      {/* 1.8. ABOUT OUR PROJECT & ARCHITECTURE */}
      <section className="w-full min-h-screen flex flex-col justify-center snap-start py-24 bg-white/[0.01] border-t border-white/5 backdrop-blur-sm overflow-hidden">
        <ScrollReveal>
         <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-[0.3em] mb-4">System Design</h2>
            <h3 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">About Our Project & Architecture</h3>
            <p className="max-w-2xl mx-auto text-slate-400 text-lg font-medium mb-16">
               A comprehensive overview of our deep learning pipeline, integrating multi-stage neural networks for landmark detection, skeletal classification, and volumetric airway analysis.
            </p>
            <div className="max-w-5xl mx-auto p-4 rounded-[2.5rem] border border-white/10 bg-white/[0.03] backdrop-blur-md shadow-2xl relative group">
               <div className="absolute inset-0 bg-cyan-500/5 blur-[80px] rounded-[2.5rem] opacity-50 group-hover:opacity-80 transition-opacity duration-700"></div>
               <img 
                  src="/images/architecture_diagram.png" 
                  alt="Project Architecture Diagram" 
                  className="w-full h-auto rounded-[2rem] relative z-10 border border-white/10 shadow-lg"
               />
            </div>
         </div>
        </ScrollReveal>
      </section>

      {/* 1.9. MEDICAL ANALYSIS SKULL */}
      <section className="w-full min-h-screen flex flex-col justify-center snap-start py-24 px-6 max-w-7xl mx-auto border-t border-white/5 overflow-hidden">
        <ScrollReveal>
          <div className="max-w-4xl mx-auto relative group animate-float">
             <div className="absolute inset-0 bg-cyan-500/10 blur-[120px] rounded-full opacity-30"></div>
             <img 
               src="/images/skull_medical_analysis.png" 
               alt="Clinical AI Analysis" 
               className="w-full h-auto rounded-[2rem] border border-white/10 shadow-3xl grayscale-[0.2] group-hover:grayscale-0 transition-all duration-1000 relative z-10" 
             />
          </div>
        </ScrollReveal>
      </section>

      {/* 2. STATS BAR */}
      <section className="w-full min-h-screen flex flex-col justify-center snap-start border-y border-white/5 bg-white/[0.02] backdrop-blur-md py-12">
         <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 text-center">
            <div className="space-y-2">
               <div className="text-4xl font-bold text-white">2.4<span className="text-sm font-medium text-slate-400 ml-1">s</span></div>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Analysis Speed</p>
            </div>
            <div className="space-y-2">
               <div className="text-4xl font-bold text-white">11 / 19</div>
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Anatomical Benchmarks</p>
            </div>
         </div>
      </section>

      {/* 3. PRECISION SUITE */}
      <section className="w-full min-h-screen flex flex-col justify-center snap-start py-32 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-20">
           <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-[0.3em] mb-4">Precision Suite</h2>
           <h3 className="text-4xl md:text-6xl font-bold tracking-tight leading-none mb-6">Engineered for Precision</h3>
           <p className="text-slate-500 max-w-xl mx-auto font-medium">Harness the power of neural networks trained for specialized anatomical precision.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
           <FeatureCard 
             icon={<Cpu size={32} />}
             title="Neural Landmark Detection"
             desc="Our proprietary AI identifies 11 and 19 diagnostic landmarks in seconds with sub-millimeter clinical accuracy."
             highlight
           />
           <FeatureCard 
             icon={<Layers size={32} />}
             title="Automated Classification"
             desc="Instantly analyze skeletal patterns and dentofacial relationships with peer-validated clinical models."
           />
           <FeatureCard 
             icon={<Activity size={32} />}
             title="Airway Analysis"
             desc="Identify pharyngeal space restrictions with AI-assisted 2D volumetric estimations for surgical planning."
           />
           <FeatureCard 
             icon={<ClipboardList size={32} />}
             title="Interactive Adjustments"
             desc="Maintain complete clinical control. Refine AI-suggested points ensure your expert judgment is final."
           />
        </div>
      </section>

      {/* 4. WORKFLOW SECTION */}
      <section className="w-full min-h-screen flex flex-col justify-center snap-start py-32 bg-white/[0.01] border-y border-white/5 backdrop-blur-sm">
         <div className="max-w-7xl mx-auto px-6 text-center">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-16">Seamless Clinical Workflow</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4">
               <WorkflowIcon icon={<FileText size={24} />} label="Upload" desc="DICOM/JPEG Secure Intake" />
               <WorkflowIcon icon={<Layers size={24} />} label="Convert" desc="AI-Powered Point Mapping" />
               <WorkflowIcon icon={<Share2 size={24} />} label="Adjust" desc="Precision Clinical Tuning" />
               <WorkflowIcon icon={<CheckCircle2 size={24} />} label="Export" desc="Ready Analysis Reports" />
            </div>
         </div>
      </section>

      {/* 5. PRACTICE ELEVATION */}
      <section className="w-full min-h-screen flex flex-col justify-center snap-start py-32 px-6 max-w-7xl mx-auto">
         <div className="flex flex-col lg:flex-row items-center gap-20">
            <div className="flex-1 space-y-10">
               <div>
                  <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-[0.3em] mb-4">The Clinical Advantage</h2>
                  <h3 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.1]">Elevate Your Practice Standard</h3>
               </div>
               
               <div className="space-y-6">
                  <BenefitItem title="Eliminate Inter-Observer Variability" desc="Consistent results every time, regardless of the clinician performing the analysis." />
                  <BenefitItem title="60% Reduction in Analysis Time" desc="Reclaim hours each week by automating manual tracing and clinical calculations." />
                  <BenefitItem title="Patient Engagement Score" desc="Communicate treatment plans more effectively with clear visual AI-augmented reports." />
               </div>
            </div>
            
            <div className="flex-1 w-full max-w-xl">
               <div className="relative rounded-[3rem] overflow-hidden border border-white/10 shadow-3xl">
                  <img src="/images/doctor_clinical_review.png" alt="Clinical Workflow" className="w-full h-auto opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#020408] via-transparent to-transparent opacity-60"></div>
               </div>
            </div>
         </div>
      </section>

      {/* 6. CTA FOOTER */}
      <section className="w-full min-h-screen flex flex-col justify-center snap-start py-32 px-6">
         <div className="max-w-5xl mx-auto bg-gradient-to-br from-indigo-900/20 to-cyan-900/20 border border-white/10 rounded-[3rem] p-12 md:p-24 text-center backdrop-blur-xl">
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight mb-8">Ready for the Future?</h2>
            <p className="text-slate-400 max-w-lg mx-auto font-medium mb-12">Join modern practices worldwide using CephaloAI for clinical diagnostics and superior patient outcomes.</p>
            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <button onClick={() => navigate("/login")} className="px-12 py-5 bg-cyan-500 text-[#050a1a] rounded-lg font-bold hover:bg-white transition-all shadow-xl shadow-cyan-500/20 active:scale-95">
                Create Free Account
              </button>
              <button onClick={() => navigate("/login")} className="px-12 py-5 bg-transparent border border-white/20 text-white rounded-lg font-bold hover:bg-white/5 transition-all active:scale-95">
                Schedule Demo
              </button>
            </div>
         </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="w-full min-h-screen flex flex-col justify-center snap-start py-20 px-6 max-w-7xl mx-auto border-t border-white/5 backdrop-blur-sm">
         <div className="grid grid-cols-1 md:grid-cols-4 gap-16 mb-16">
            <div className="space-y-6">
               <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                     <Activity className="text-white" size={16} strokeWidth={3} />
                  </div>
                  <span className="text-xl font-bold tracking-tight">CephaloAI</span>
               </div>
               <p className="text-xs text-slate-500 leading-relaxed uppercase tracking-wider font-bold">Bringing anatomical precision to clinical orthodontics.</p>
            </div>
            
            <FooterColumn title="Product" links={["Features", "Integrations", "API Access", "Pricing"]} />
            <FooterColumn title="Legal" links={["HIPAA Compliance", "Privacy Policy", "Terms of Service", "Security"]} />
            <FooterColumn title="Company" links={["About Us", "Careers", "Clinical Data", "Contact"]} />
         </div>
         
         <div className="flex flex-col md:flex-row justify-between items-center pt-10 border-t border-white/5 text-slate-600 text-[10px] font-bold uppercase tracking-[0.2em]">
            <p>© 2026 CEPHALO AI CLINICAL SYSTEMS. ALL RIGHTS RESERVED.</p>
            <div className="flex gap-8 mt-6 md:mt-0">
               <Share2 size={16} className="hover:text-white cursor-pointer transition-colors" />
               <Activity size={16} className="hover:text-white cursor-pointer transition-colors" />
               <Laptop size={16} className="hover:text-white cursor-pointer transition-colors" />
            </div>
         </div>
      </footer>
    </div>
    </>
  );
}

function FeatureCard({ icon, title, desc, highlight }) {
  return (
    <div className={`p-10 rounded-[2rem] border transition-all group backdrop-blur-md ${highlight ? 'bg-white/[0.03] border-cyan-500/30 shadow-lg shadow-cyan-500/5' : 'bg-transparent border-white/5 hover:border-white/20'}`}>
      <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-8 ${highlight ? 'bg-cyan-500 text-[#050a1a]' : 'bg-white/5 text-slate-300'} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <h4 className="text-xl font-bold text-white mb-4 tracking-tight">{title}</h4>
      <p className="text-sm text-slate-500 font-medium leading-relaxed group-hover:text-slate-400 transition-colors">{desc}</p>
    </div>
  );
}

function WorkflowIcon({ icon, label, desc }) {
   return (
      <div className="flex flex-col items-center text-center space-y-4">
         <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-cyan-400 shadow-inner backdrop-blur-md">
            {icon}
         </div>
         <div className="space-y-1">
            <h5 className="font-bold text-white tracking-tight">{label}</h5>
            <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">{desc}</p>
         </div>
      </div>
   );
}

function BenefitItem({ title, desc }) {
   return (
      <div className="flex gap-4 group">
         <div className="mt-1.5 w-5 h-5 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20 group-hover:bg-cyan-500 group-hover:text-[#050a1a] transition-all">
            <CheckCircle2 size={12} />
         </div>
         <div>
            <h5 className="font-bold text-white mb-1">{title}</h5>
            <p className="text-sm text-slate-500">{desc}</p>
         </div>
      </div>
   );
}

function FooterColumn({ title, links }) {
   const navigate = useNavigate();
   
   const handleLink = (link) => {
      console.log("Navigating to:", link);
      const l = link.toLowerCase();
      
      // Force scroll to top on any navigation
      window.scrollTo({ top: 0, behavior: 'auto' });

      if (["features", "integrations", "api access", "pricing"].includes(l)) {
         navigate("/lm");
      } else if (["about us", "contact", "clinical data", "careers", "hipaa compliance", "privacy policy", "terms of service", "security"].includes(l)) {
         navigate("/");
      } else {
         navigate("/");
      }
   };

   return (
      <div className="space-y-6">
         <h5 className="text-[11px] font-black text-white uppercase tracking-[0.3em]">{title}</h5>
         <ul className="space-y-4">
            {links.map(l => (
               <li 
                 key={l} 
                 onClick={() => handleLink(l)}
                 className="text-xs text-slate-500 hover:text-cyan-400 cursor-pointer transition-all duration-200 font-bold uppercase tracking-widest flex items-center gap-2 group"
               >
                 <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 scale-0 group-hover:scale-100 transition-transform"></span>
                 {l}
               </li>
            ))}
         </ul>
      </div>
   );
}
