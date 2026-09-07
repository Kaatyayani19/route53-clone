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
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

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
      showNotification("Successfully logged in to AWS Route 53 Console", "success");
    } catch (err: any) {
      setError("Invalid credentials or server error.");
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
        setIsCreateModalOpen(false);
        fetchZones();
        showNotification("Hosted zone successfully created.", "success");
      }
    } catch (err) {
      showNotification("Failed to create hosted zone.", "error");
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
        showNotification("Hosted zone updated successfully.", "success");
      }
    } catch (err) {
      showNotification("Failed to update hosted zone.", "error");
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm("Are you sure you want to delete this hosted zone?")) return;

    try {
      const res = await fetch(`${API_URL}/api/hosted-zones/${zoneId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        fetchZones();
        showNotification("Hosted zone deleted successfully.", "success");
      }
    } catch (err) {
      showNotification("Failed to delete hosted zone.", "error");
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
      showNotification("Logged out successfully.", "success");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const filteredZones = hostedZones.filter((zone) =>
    zone.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-100 text-gray-800">
        {/* AWS Navigation Header */}
        <header className="bg-[#232f3e] text-white px-6 py-3 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-4">
            <span className="font-bold text-lg tracking-wide text-orange-400">AWS</span>
            <span className="text-gray-300">| Route 53</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-300">User: {username || "Admin"}</span>
            <button onClick={handleLogout} className="bg-[#16191f] border border-gray-600 text-white px-3 py-1 text-sm rounded hover:bg-gray-700">
              Sign Out
            </button>
          </div>
        </header>

        {/* Sub Navigation Tabs */}
        <nav className="bg-white border-b px-6 flex gap-8 text-sm font-medium text-gray-600 shadow-sm">
          {["dashboard", "hosted-zones", "traffic-policies", "health-checks", "resolver", "profiles"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 capitalize ${activeTab === tab ? "border-b-2 border-orange-500 text-orange-600 font-semibold" : "hover:text-black"}`}
            >
              {tab.replace("-", " ")}
            </button>
          ))}
        </nav>

        {/* Notification Banner */}
        {notification && (
          <div className={`mx-6 mt-4 p-3 rounded text-sm ${notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
            {notification.message}
          </div>
        )}

        <main className="p-6 max-w-7xl mx-auto">
          {activeTab === "hosted-zones" ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Hosted zones</h1>
                  <p className="text-sm text-gray-500">A hosted zone is a container for information about how you want to route traffic on the internet for a domain.</p>
                </div>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-medium px-4 py-2 rounded text-sm shadow"
                >
                  Create hosted zone
                </button>
              </div>

              {/* Table Container */}
              <div className="bg-white border rounded shadow-sm">
                <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                  <input
                    type="text"
                    placeholder="Find hosted zones"
                    className="border px-3 py-1.5 rounded text-sm w-72 bg-white"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className="text-xs text-gray-500">{filteredZones.length} Hosted Zone(s)</span>
                </div>

                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b bg-gray-50 text-xs text-gray-600 uppercase tracking-wider">
                      <th className="p-4">Domain name</th>
                      <th className="p-4">Zone ID</th>
                      <th className="p-4">Type</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {filteredZones.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-gray-500">
                          No hosted zones found.
                        </td>
                      </tr>
                    ) : (
                      filteredZones.map((zone) => (
                        <tr key={zone.id} className="hover:bg-gray-50">
                          <td className="p-4 font-medium text-blue-600">
                            {editingZoneId === zone.id ? (
                              <div className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  className="border p-1 rounded text-sm"
                                  value={editZoneName}
                                  onChange={(e) => setEditZoneName(e.target.value)}
                                />
                                <button onClick={() => handleUpdateZone(zone.id)} className="bg-green-600 text-white px-2 py-1 rounded text-xs">Save</button>
                                <button onClick={() => setEditingZoneId(null)} className="bg-gray-300 px-2 py-1 rounded text-xs">Cancel</button>
                              </div>
                            ) : (
                              zone.name
                            )}
                          </td>
                          <td className="p-4 text-gray-500 text-xs font-mono">{zone.id}</td>
                          <td className="p-4 text-gray-600">Public</td>
                          <td className="p-4 text-right space-x-2">
                            {editingZoneId !== zone.id && (
                              <button
                                onClick={() => { setEditingZoneId(zone.id); setEditZoneName(zone.name); }}
                                className="border px-3 py-1 rounded text-xs text-gray-700 hover:bg-gray-100"
                              >
                                Edit
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteZone(zone.id)}
                              className="border border-red-300 text-red-600 px-3 py-1 rounded text-xs hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white border p-12 rounded shadow-sm text-center">
              <h2 className="text-xl font-bold mb-2 capitalize">{activeTab.replace("-", " ")}</h2>
              <p className="text-gray-500 text-sm">Coming Soon - AWS Route 53 Console Experience</p>
            </div>
          )}
        </main>

        {/* Create Hosted Zone Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
              <h3 className="text-lg font-bold mb-4">Create hosted zone</h3>
              <form onSubmit={handleCreateZone}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Domain name</label>
                  <input
                    type="text"
                    placeholder="example.com"
                    className="w-full border p-2 rounded text-sm"
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="border px-4 py-2 rounded text-sm hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-[#ec7211] text-white px-4 py-2 rounded text-sm hover:bg-[#eb5f07]"
                  >
                    Create hosted zone
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-[#232f3e]">
      <div className="bg-white p-8 rounded shadow-md w-96 border-t-4 border-orange-500">
        <div className="flex items-center justify-center mb-6 gap-2">
          <span className="font-bold text-xl text-[#232f3e]">AWS</span>
          <span className="text-gray-500 text-lg">Route 53 Login</span>
        </div>
        {error && <p className="text-red-600 text-xs mb-4 text-center">{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Username</label>
            <input
              type="text"
              className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase text-gray-600 mb-1">Password</label>
            <input
              type="password"
              className="w-full border p-2 rounded text-sm focus:ring-2 focus:ring-orange-500 outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ec7211] text-white p-2.5 rounded text-sm font-medium hover:bg-[#eb5f07] transition"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}