import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

export default function AutoLandmark() {
  const { id } = useParams();              // predictionId from URL
  const { getAuthHeaders } = useContext(AuthContext);

  const [ceph, setCeph] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const API_URL = "http://localhost:8000";

  useEffect(() => {
    async function fetchCeph() {
      try {
        const res = await fetch(`${API_URL}/cephalogram/${id}`, {
          headers: getAuthHeaders(),
        });

        if (!res.ok) throw new Error("Failed to load cephalogram");

        const data = await res.json();
        setCeph(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchCeph();
  }, [id, getAuthHeaders]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">{error}</p>;
  if (!ceph) return <p>Cephalogram not found</p>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold">Landmark Prediction</h2>

      <img 
        src={ceph.image_url} 
        alt="Predicted Cephalogram"
        className="max-w-xl border rounded mt-3"
      />

      <h3 className="mt-6 text-lg font-semibold">Landmarks</h3>

      <table className="mt-2 text-sm">
        <tbody>
          {ceph.landmarks?.map((p, index) => (
            <tr key={index}>
              <td>{p.name}</td>
              <td>{p.x.toFixed(4)}</td>
              <td>{p.y.toFixed(4)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {ceph.excel_file && (
        <a 
          href={ceph.excel_file} 
          className="mt-4 inline-block text-blue-500 underline"
          download
        >
          Download Excel
        </a>
      )}
    </div>
  );
}
