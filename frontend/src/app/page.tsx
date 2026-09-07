"use client";

import { useState, useEffect } from 'react';

const API_URL = "https://route53-clone-1-0xn7.onrender.com";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hostedZones, setHostedZones] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newZoneName, setNewZoneName] = useState("");
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editZoneName, setEditZoneName] = useState("");
  const [activeTab, setActiveTab] = useState("hosted-zones");

  const fetchZones = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hosted-zones`, {
        credentials: "include",
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        setHostedZones(data);
      } else {
        setHostedZones([]);
      }
    } catch (err) {
      console.error("Failed to fetch zones", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchZones();
    }
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (!response.ok) throw new Error("Login failed");
      setIsLoggedIn(true);
    } catch (err: any) {
      setError("Failed to fetch: Invalid credentials or server error.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateZone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newZoneName) return;

    try {
      const res = await fetch(`${API_URL}/api/hosted-zones`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newZoneName }),
        credentials: "include",
      });

      if (res.ok) {
        setNewZoneName("");
        fetchZones();
      }
    } catch (err) {
      console.error("Failed to create zone", err);
    }
  };

  const handleUpdateZone = async (zoneId: string) => {
    if (!editZoneName) return;

    try {
      const res = await fetch(`${API_URL}/api/hosted-zones/${zoneId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editZoneName }),
        credentials: "include",
      });

      if (res.ok) {
        setEditingZoneId(null);
        setEditZoneName("");
        fetchZones();
      }
    } catch (err) {
      console.error("Failed to update zone", err);
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/hosted-zones/${zoneId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) fetchZones();
    } catch (err) {
      console.error("Failed to delete zone", err);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      setIsLoggedIn(false);
      setUsername("");
      setPassword("");
      setHostedZones([]);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const filteredZones = hostedZones.filter((zone) =>
    zone.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoggedIn) {
    return (
      <div className="p-8 max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Route 53 Clone Dashboard</h1>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
            Log Out
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b mb-6 gap-6 text-sm font-medium text-gray-600">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`pb-2 ${activeTab === "dashboard" ? "border-b-2 border-orange-600 text-orange-600 font-semibold" : "hover:text-black"}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab("hosted-zones")}
            className={`pb-2 ${activeTab === "hosted-zones" ? "border-b-2 border-orange-600 text-orange-600 font-semibold" : "hover:text-black"}`}
          >
            Hosted Zones
          </button>
          <button
            onClick={() => setActiveTab("traffic-policies")}
            className={`pb-2 ${activeTab === "traffic-policies" ? "border-b-2 border-orange-600 text-orange-600 font-semibold" : "hover:text-black"}`}
          >
            Traffic Policies
          </button>
          <button
            onClick={() => setActiveTab("health-checks")}
            className={`pb-2 ${activeTab === "health-checks" ? "border-b-2 border-orange-600 text-orange-600 font-semibold" : "hover:text-black"}`}
          >
            Health Checks
          </button>
          <button
            onClick={() => setActiveTab("resolver")}
            className={`pb-2 ${activeTab === "resolver" ? "border-b-2 border-orange-600 text-orange-600 font-semibold" : "hover:text-black"}`}
          >
            Resolver
          </button>
          <button
            onClick={() => setActiveTab("profiles")}
            className={`pb-2 ${activeTab === "profiles" ? "border-b-2 border-orange-600 text-orange-600 font-semibold" : "hover:text-black"}`}
          >
            Profiles
          </button>
        </div>

        {/* Conditional Content Rendering */}
        {activeTab === "hosted-zones" ? (
          <div>
            {/* Create Hosted Zone Form */}
            <div className="border p-6 rounded shadow-sm bg-white mb-6">
              <h2 className="text-lg font-semibold mb-4">Create Hosted Zone</h2>
              <form onSubmit={handleCreateZone} className="flex gap-4">
                <input
                  type="text"
                  placeholder="e.g., example.com"
                  className="flex-1 border p-2 rounded"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  required
                />
                <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                  Create Zone
                </button>
              </form>
            </div>

            {/* Search & Hosted Zones List */}
            <div className="border p-6 rounded shadow-sm bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Hosted Zones</h2>
                <input
                  type="text"
                  placeholder="Search zones..."
                  className="border p-2 rounded w-64 text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {filteredZones.length === 0 ? (
                <p className="text-gray-500">No hosted zones found.</p>
              ) : (
                <ul className="divide-y">
                  {filteredZones.map((zone) => (
                    <li key={zone.id} className="py-4 flex justify-between items-center">
                      <div>
                        {editingZoneId === zone.id ? (
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              className="border p-1 rounded text-sm"
                              value={editZoneName}
                              onChange={(e) => setEditZoneName(e.target.value)}
                            />
                            <button
                              onClick={() => handleUpdateZone(zone.id)}
                              className="bg-green-600 text-white px-2 py-1 rounded text-xs"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingZoneId(null)}
                              className="bg-gray-300 px-2 py-1 rounded text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <p className="font-semibold text-lg">{zone.name}</p>
                            <p className="text-xs text-gray-400">ID: {zone.id}</p>
                          </>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {editingZoneId !== zone.id && (
                          <button
                            onClick={() => {
                              setEditingZoneId(zone.id);
                              setEditZoneName(zone.name);
                            }}
                            className="bg-gray-100 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-200"
                          >
                            Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteZone(zone.id)}
                          className="bg-red-100 text-red-600 px-3 py-1 rounded text-sm hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ) : (
          /* Mocked Coming Soon Page */
          <div className="border p-12 rounded shadow-sm bg-white text-center">
            <h2 className="text-2xl font-bold mb-2 capitalize">{activeTab.replace("-", " ")}</h2>
            <p className="text-gray-500 mb-4">Coming Soon</p>
            <p className="text-sm text-gray-400">This section is currently under development.</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-96">
        <h1 className="text-xl font-bold mb-4">Route 53 Login</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Username</label>
            <input
              type="text"
              className="w-full border p-2 rounded"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              className="w-full border p-2 rounded"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-orange-600 text-white p-2 rounded hover:bg-orange-700"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}