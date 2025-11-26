// filepath: src/components/doctor/CreatePatient.js
import React, { useState, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CreatePatient() {
  const { currentUser, token } = useContext(AuthContext);
  const nav = useNavigate();

  const [form, setForm] = useState({
    name: "",
    dob: "",
    gender: "M",
    email: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_URL = "http://localhost:8000"; // 🔗 your FastAPI backend

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Backend expects: { name, dob, notes }
      const payload = {
        name: form.name,
        dob: form.dob || "",
        notes: `${form.gender}, ${form.age || ""}, ${form.email}, ${form.phone}, ${form.address}`,
      };

      const res = await fetch(`${API_URL}/patients`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || "Failed to create patient");
      }

      const data = await res.json();
      console.log("✅ Patient created:", data);

      setLoading(false);
      nav("/doctor/dashboard");
    } catch (err) {
      console.error("Error creating patient:", err);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Create Patient</h2>
      <form
        onSubmit={submit}
        className="bg-white p-4 rounded shadow space-y-3 text-gray-700"
      >
        <input
          required
          placeholder="Full Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <input
          type="date"
          placeholder="Date of Birth"
          value={form.dob}
          onChange={(e) => setForm({ ...form, dob: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <select
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
          className="w-full border p-2 rounded"
        >
          <option value="M">Male</option>
          <option value="F">Female</option>
          <option value="Other">Other</option>
        </select>
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <input
          placeholder="Phone"
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          className="w-full border p-2 rounded"
        />
        <input
          placeholder="Address"
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          className="w-full border p-2 rounded"
        />

        {error && <div className="text-sm text-red-500">{error}</div>}

        <div className="flex justify-end">
          <button
            disabled={loading}
            className={`px-4 py-2 rounded text-white ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-indigo-600 hover:bg-indigo-500"
            }`}
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      </form>
    </main>
  );
}
