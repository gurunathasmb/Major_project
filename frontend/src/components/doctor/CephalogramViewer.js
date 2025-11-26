import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function CephalogramViewer() {
  const { id } = useParams();           // <-- predictionId
  const { getAuthHeaders } = useContext(AuthContext);

  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const API_URL = "http://localhost:8000";

  useEffect(() => {
    if (!id) {
      setError("Invalid ID");
      return;
    }

    fetch(`${API_URL}/cephalogram/${id}`, {
      headers: getAuthHeaders(),
    })
      .then(res => {
        if (!res.ok) throw new Error("Failed to load cephalogram");
        return res.json();
      })
      .then(setData)
      .catch(err => setError(err.message));
  }, [id, getAuthHeaders]);

  if (error) return <p className="text-red-500">{error}</p>;
  if (!data) return <p className="text-gray-300">Loading...</p>;
  if (!data.image_url) return <p>No prediction image found.</p>;

  return (
    <div className="p-6 text-gray-100">
      <h2 className="text-xl font-bold mb-4">Prediction Result</h2>

      <img
        src={data.image_url}
        alt="Predicted"
        className="w-full max-w-3xl rounded shadow"
      />

      {/* Overlay landmarks */}
      <div className="relative">
        {data.landmarks?.map((p, i) => (
          <div
            key={i}
            className="absolute bg-cyan-400 w-2 h-2 rounded-full"
            style={{
              left: `${p.x * 100}%`,
              top: `${p.y * 100}%`,
              transform: "translate(-50%, -50%)",
            }}
          ></div>
        ))}
      </div>

      {/* Excel Download */}
      {data.excel_file && (
        <a
          href={data.excel_file}
          className="text-green-400 underline mt-4 inline-block"
          download
        >
          Download Excel
        </a>
      )}
    </div>
  );
}
