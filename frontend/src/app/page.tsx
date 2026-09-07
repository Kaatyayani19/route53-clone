"use client";

import { useState, useEffect } from "react";

interface HostedZone {
  id: string;
  name: string;
  comment: string | null;
  record_count: number;
  created_at: string;
}

export default function Dashboard() {
  const [zones, setZones] = useState<HostedZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [comment, setComment] = useState("");

  const fetchZones = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:8000/api/hosted-zones");
      if (!res.ok) throw new Error("Failed to fetch hosted zones");
      const data = await res.json();
      setZones(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const res = await fetch("http://localhost:8000/api/hosted-zones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, comment }),
      });

      if (!res.ok) throw new Error("Failed to create hosted zone");

      setName("");
      setComment("");
      fetchZones(); // Refresh the list
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hosted zone?")) return;

    try {
      const res = await fetch(`http://localhost:8000/api/hosted-zones/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete hosted zone");
      fetchZones();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        {/* AWS Header style */}
        <header className="border-b pb-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-orange-600">Amazon Route 53</h1>
            <p className="text-sm text-gray-600">Hosted zones dashboard clone</p>
          </div>
          <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium">
            Connected to FastAPI
          </span>
        </header>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 text-red-700 text-sm">
            Backend Connection Error: {error} (Make sure your FastAPI server is running on port 8000)
          </div>
        )}

        {/* Create Zone Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h2 className="text-lg font-semibold mb-4">Create Hosted Zone</h2>
          <form onSubmit={handleCreateZone} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Domain name (e.g., example.com)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <input
              type="text"
              placeholder="Comment (optional)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded text-sm transition"
            >
              Create Hosted Zone
            </button>
          </form>
        </div>

        {/* Hosted Zones Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold">Hosted Zones ({zones.length})</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading hosted zones...</div>
          ) : zones.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No hosted zones found. Create your first one above!</div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b bg-gray-100 text-gray-600">
                  <th className="p-3">Domain Name</th>
                  <th className="p-3">Comment</th>
                  <th className="p-3">Records</th>
                  <th className="p-3">Created At</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr key={zone.id} className="border-b hover:bg-gray-50">
                    <td 
                      className="p-3 font-medium text-blue-600 hover:underline cursor-pointer"
                      onClick={() => window.location.href = `/zones/${zone.id}`}
                    >
                      {zone.name}
                    </td>
                    <td className="p-3 text-gray-600">{zone.comment || "-"}</td>
                    <td className="p-3">{zone.record_count}</td>
                    <td className="p-3 text-gray-500">{new Date(zone.created_at).toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteZone(zone.id)}
                        className="text-red-600 hover:text-red-800 font-medium text-xs border border-red-200 px-2.5 py-1 rounded hover:bg-red-50 transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}