// filepath: src/components/auth/LoginPage.js
import React, { useState, useContext, useMemo } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Float, Points, PointMaterial } from "@react-three/drei";

export default function LoginPage() {
  const { login, error, loading, currentUser } = useContext(AuthContext);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("doctor");
  const [isRegister, setIsRegister] = useState(false);
  const [registerError, setRegisterError] = useState(null);
  const [registerLoading, setRegisterLoading] = useState(false);
  const nav = useNavigate();

  const API_URL = "http://localhost:8000"; // ⚙️ FastAPI backend URL

  // 🟩 LOGIN handler
  const handleLogin = async (e) => {
    e.preventDefault();
    const ok = await login(email, password);
    if (ok) {
      const userRole = currentUser?.role || "doctor";
      if (userRole === "admin") nav("/admin/dashboard");
      else if (userRole === "doctor") nav("/doctor/dashboard");
      else nav("/patient/dashboard");
    }
  };

  // 🟦 REGISTER handler
  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterError(null);
    setRegisterLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: email, password, role }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Registration failed");
      }

      // auto-login after register
      const ok = await login(email, password);
      if (ok) {
        const userRole = currentUser?.role || role;
        if (userRole === "admin") nav("/admin/dashboard");
        else if (userRole === "doctor") nav("/doctor/dashboard");
        else nav("/patient/dashboard");
      }
    } catch (err) {
      console.error("Registration error:", err);
      setRegisterError(err.message);
    } finally {
      setRegisterLoading(false);
    }
  };

  // 🌀 Background particle generation
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
              sizeAttenuation
              depthWrite={false}
            />
          </Points>
        </Float>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate />
      </Canvas>

      {/* Foreground Login/Register Box */}
      <div className="relative z-10 max-w-md w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl shadow-lg p-8 text-white">
        <h2 className="text-3xl font-semibold mb-4 text-center text-white">
          {isRegister ? "Register New Account" : "Ceph AI Login"}
        </h2>

        <form
          onSubmit={isRegister ? handleRegister : handleLogin}
          className="space-y-3"
        >
          <div>
            <label className="text-sm text-gray-200">Email</label>
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-transparent border border-gray-500 p-2 rounded text-white focus:border-cyan-400"
            />
          </div>

          <div>
            <label className="text-sm text-gray-200">Password</label>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-transparent border border-gray-500 p-2 rounded text-white focus:border-cyan-400"
            />
          </div>

          {isRegister && (
            <div>
              <label className="text-sm text-gray-200">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-transparent border border-gray-500 p-2 rounded text-white focus:border-cyan-400"
              >
                <option value="doctor">Doctor</option>
                <option value="admin">Admin</option>
                <option value="patient">Patient</option>
              </select>
            </div>
          )}

          {(error || registerError) && (
            <div className="text-sm text-red-400">{error || registerError}</div>
          )}

          <button
            disabled={loading || registerLoading}
            className={`w-full py-2 rounded font-semibold transition ${
              loading || registerLoading
                ? "bg-gray-500 cursor-not-allowed"
                : "bg-cyan-500 hover:bg-cyan-400"
            }`}
          >
            {isRegister
              ? registerLoading
                ? "Registering..."
                : "Register"
              : loading
              ? "Signing in..."
              : "Sign in"}
          </button>
        </form>

        <div className="text-xs text-gray-300 mt-3 text-center">
          {isRegister ? (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setIsRegister(false)}
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Sign in
              </button>
            </>
          ) : (
            <>
              Don’t have an account?{" "}
              <button
                onClick={() => setIsRegister(true)}
                className="text-cyan-400 hover:text-cyan-300 underline"
              >
                Register
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
