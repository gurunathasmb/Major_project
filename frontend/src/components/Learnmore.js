// filepath: src/components/LearnMorePage.js
import React, { useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Points, PointMaterial, Float } from "@react-three/drei";
import { motion } from "framer-motion";

export default function LearnMorePage() {
  // create particle field for 3D background
  const particles = useMemo(() => {
    const positions = new Float32Array(4000);
    for (let i = 0; i < positions.length; i++) {
      positions[i] = (Math.random() - 0.5) * 15;
    }
    return positions;
  }, []);

  return (
    <div className="relative min-h-screen text-white overflow-x-hidden">
      {/* 3D Animated Background */}
      <Canvas
        camera={{ position: [0, 0, 5] }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 0,
        }}
      >
        <color attach="background" args={["#050510"]} />
        <ambientLight intensity={0.6} />
        <Float speed={2} rotationIntensity={1} floatIntensity={2}>
          <Points positions={particles} stride={3}>
            <PointMaterial
              transparent
              color="#00ffff"
              size={0.025}
              sizeAttenuation
              depthWrite={false}
            />
          </Points>
        </Float>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate />
      </Canvas>

      {/* Foreground Content */}
      <div className="relative z-10">
        {/* Header Section */}
        <motion.div
          className="text-center pt-24 pb-12 px-6"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h1 className="text-5xl font-bold text-green-400 mb-4">
            Learn More About Ceph AI
          </h1>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            An intelligent Cephalometric Analysis System integrating AI-driven
            landmark detection, classification, and airway correlation — 
            automating orthodontic diagnostics with precision.
          </p>
        </motion.div>

        {/* About Section */}
        <motion.section
          className="max-w-5xl mx-auto px-6 py-12 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 shadow-lg mb-10"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-3xl font-semibold text-red-300 mb-4">
            🌐 What is Ceph AI?
          </h2>
          <p className="text-gray-200 leading-relaxed">
            Ceph AI is an AI-powered system that automates the process of
            identifying anatomical landmarks from cephalometric X-rays. It
            performs landmark localization, skeletal classification (Class I,
            II, III), and airway parameter correlation — generating detailed
            visual reports for orthodontic analysis.
          </p>
        </motion.section>

        {/* Features Section */}
        <motion.section
          className="max-w-6xl mx-auto grid md:grid-cols-3 gap-6 px-6"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          {[
            {
              title: "🧠 AI Landmark Detection",
              desc: "Automatically detects and corrects cephalometric landmarks using deep learning (trained on ISBI 2015 dataset).",
            },
            {
              title: "📊 Cephalometric Classification",
              desc: "Classifies skeletal patterns into Class I, II, and III with integrated ceph-angle computation.",
            },
            {
              title: "🌬️ Airway Correlation",
              desc: "Correlates airway parameters with skeletal structure for advanced orthodontic and airway assessment.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:scale-105 transition transform shadow-lg"
            >
              <h3 className="text-xl font-semibold text-red-300 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-200">{feature.desc}</p>
            </div>
          ))}
        </motion.section>

        {/* Pipeline Section */}
        <motion.section
          className="max-w-5xl mx-auto px-6 py-12 mt-10 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <h2 className="text-3xl font-semibold text-red-400 mb-4">
            🔬 System Pipeline
          </h2>
          <ul className="list-disc list-inside text-gray-200 space-y-2">
            <li>Image upload via secure interface</li>
            <li>AI landmark detection and correction</li>
            <li>Classification into skeletal classes (I, II, III)</li>
            <li>Airway parameter analysis and correlation</li>
            <li>Automatic report generation with visual overlays</li>
          </ul>
        </motion.section>

        {/* CTA Section */}
        <motion.div
          className="text-center py-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
        >
          <button
            onClick={() => (window.location.href = "/login")}
            className="px-10 py-4 bg-cyan-500 hover:bg-cyan-400 text-green-500 rounded-xl font-semibold text-lg transition"
          >
            Get Started with Ceph AI
          </button>
        </motion.div>

        {/* Footer */}
        <footer className="text-center text-gray-400 text-sm pb-6">
          © {new Date().getFullYear()} Ceph AI — Automated Cephalometric Intelligence
        </footer>
      </div>
    </div>
  );
}
