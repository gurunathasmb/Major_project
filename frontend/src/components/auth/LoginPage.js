// filepath: src/components/auth/LoginPage.js
import React, { useState, useContext, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext";
import { DoctorContext } from "../../context/DoctorContext";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, Points, PointMaterial } from "@react-three/drei";

export default function LoginPage() {
  const { login, error } = useContext(AuthContext);
  const { doctors } = useContext(DoctorContext);
  const [role, setRole] = useState("admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  const onSubmit = (e) => {
    e.preventDefault();
    const ok = login(email, password);
    if (ok) {
      const isAdmin = email === "admin@cephaloai.com";
      if (isAdmin) nav("/admin/dashboard");
      else nav("/doctor/dashboard");
    }
  };

  // Generate 3D particles
  const particles = useMemo(() => {
    const positions = new Float32Array(3000);
    for (let i = 0; i < positions.length; i++) {
      positions[i] = (Math.random() - 0.5) * 10;
    }
    return positions;
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background 3D Particles */}
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
        <color attach="background" args={["#0a0a1a"]} />
        <ambientLight intensity={0.6} />
        <Float speed={2} rotationIntensity={1} floatIntensity={2}>
          <Points positions={particles} stride={3}>
            <PointMaterial
              transparent
              color="#00ffff"
              size={0.03}
              sizeAttenuation={true}
              depthWrite={false}
            />
          </Points>
        </Float>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate />
      </Canvas>

      {/* Foreground Login Box */}
      <div className="relative z-10 max-w-md w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-8 text-white">
        <h2 className="text-3xl font-semibold mb-4 text-center text-white">
          Ceph AI Login
        </h2>

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label className="text-sm text-gray-200">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full bg-transparent border border-green-500 p-2 rounded text-white"
            >
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>

          <div>
            <label className="text-sm text-gray-200">Email</label>
            <input
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-gray-500 p-2 rounded text-white"
            />
          </div>

          <div>
            <label className="text-sm text-gray-200">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-gray-500 p-2 rounded text-white"
            />
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <button className="w-full bg-cyan-500 hover:bg-cyan-400 text-white-900 py-2 rounded font-semibold transition">
            Sign in
          </button>
        </form>

        <div className="text-xs text-gray-300 mt-3 text-center">
          Admin: admin@cephaloai.com / admin123 <br />
          Doctor: doctor.smith@hospital.com / doctor123
        </div>
      </div>
    </div>
  );
}
