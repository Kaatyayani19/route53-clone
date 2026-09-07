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
  const [selectedZone, setSelectedZone] = useState<any | null>(null);
  const [dnsRecords, setDnsRecords] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [newZoneName, setNewZoneName] = useState("");
  const [activeTab, setActiveTab] = useState("hosted-zones");
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isCreateZoneModal, setIsCreateZoneModal] = useState(false);
  const [isCreateRecordModal, setIsCreateRecordModal] = useState(false);
  
  // DNS Record form states
  const [recName, setRecName] = useState("");
  const [recType, setRecType] = useState("A");
  const [recTtl, setRecTtl] = useState(300);
  const [recValue, setRecValue] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  const showNotification = (message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchZones = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hosted-zones`, { credentials: "include" });
      const data = await res.json();
      if (Array.isArray(data)) setHostedZones(data);
    } catch (err) {
      console.error("Failed to fetch zones", err);
    }
  };

  const fetchRecords = async (zoneId: string) => {
    try {
      const res = await fetch(`${API_URL}/api/hosted-zones/${zoneId}/records`, { credentials: "include" });
      const data = await res.json();
      if (Array.isArray(data)) setDnsRecords(data);
      else setDnsRecords([]);
    } catch (err) {
      console.error("Failed to fetch DNS records", err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchZones();
  }, [isLoggedIn]);

  useEffect(() => {
    if (selectedZone) {
      fetchRecords(selectedZone.id);
    }
  }, [selectedZone]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Login failed");
      setIsLoggedIn(true);
      showNotification("Signed in to Route 53 Console", "success");
    } catch (err) {
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
        setIsCreateZoneModal(false);
        fetchZones();
        showNotification("Hosted zone created successfully.", "success");
      }
    } catch (err) {
      showNotification("Failed to create hosted zone.", "error");
    }
  };

  const handleDeleteZone = async (zoneId: string) => {
    if (!confirm("Delete this hosted zone?")) return;
    try {
      const res = await fetch(`${API_URL}/api/hosted-zones/${zoneId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        if (selectedZone?.id === zoneId) setSelectedZone(null);
        fetchZones();
        showNotification("Hosted zone deleted.", "success");
      }
    } catch (err) {
      showNotification("Failed to delete zone.", "error");
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recName || !recValue || !selectedZone) return;
    try {
      const res = await fetch(`${API_URL}/api/hosted-zones/${selectedZone.id}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: recName, type: recType, ttl: Number(recTtl), value: recValue }),
        credentials: "include",
      });
      if (res.ok) {
        setRecName("");
        setRecValue("");
        setIsCreateRecordModal(false);
        fetchRecords(selectedZone.id);
        showNotification("DNS record created successfully.", "success");
      }
    } catch (err) {
      showNotification("Failed to create DNS record.", "error");
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm("Delete this DNS record?")) return;
    try {
      const res = await fetch(`${API_URL}/api/dns-records/${recordId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok) {
        fetchRecords(selectedZone.id);
        showNotification("DNS record deleted.", "success");
      }
    } catch (err) {
      showNotification("Failed to delete DNS record.", "error");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
      setIsLoggedIn(false);
      setSelectedZone(null);
      setHostedZones([]);
      showNotification("Signed out.", "success");
    } catch (err) {
      console.error(err);
    }
  };

  const filteredZones = hostedZones.filter((z) => z.name.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredRecords = dnsRecords.filter((r) => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.type.toLowerCase().includes(searchQuery.toLowerCase()));

  if (isLoggedIn) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-[#121212] text-gray-100' : 'bg-gray-100 text-gray-800'}`}>
        <header className="bg-[#232f3e] text-white px-6 py-3 flex justify-between items-center shadow-md">
          <div className="flex items-center gap-4">
            <span className="font-bold text-lg text-orange-400">AWS</span>
            <span className="text-gray-300">| Route 53</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => setDarkMode(!darkMode)} className="bg-[#16191f] border border-gray-600 text-white px-3 py-1 text-xs rounded">
              {darkMode ? "☀️ Light" : "🌙 Dark"}
            </button>
            <span className="text-sm text-gray-300">User: {username || "Admin"}</span>
            <button onClick={handleLogout} className="bg-[#16191f] border border-gray-600 text-white px-3 py-1 text-sm rounded">
              Sign Out
            </button>
          </div>
        </header>

        <nav className={`border-b px-6 flex gap-8 text-sm font-medium shadow-sm ${darkMode ? 'bg-[#1e1e1e] border-gray-700 text-gray-300' : 'bg-white text-gray-600'}`}>
          {["dashboard", "hosted-zones", "traffic-policies", "health-checks", "resolver", "profiles"].map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setSelectedZone(null); }}
              className={`py-3 capitalize ${activeTab === tab ? "border-b-2 border-orange-500 text-orange-500 font-semibold" : "hover:text-black"}`}
            >
              {tab.replace("-", " ")}
            </button>
          ))}
        </nav>

        {notification && (
          <div className={`mx-6 mt-4 p-3 rounded text-sm ${notification.type === 'success' ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-red-100 text-red-800 border border-red-300'}`}>
            {notification.message}
          </div>
        )}

        <main className="p-6 max-w-7xl mx-auto">
          {activeTab === "hosted-zones" && !selectedZone && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Hosted zones</h1>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage domains and configure DNS records.</p>
                </div>
                <button onClick={() => setIsCreateZoneModal(true)} className="bg-[#ec7211] text-white font-medium px-4 py-2 rounded text-sm shadow">
                  Create hosted zone
                </button>
              </div>

              <div className={`border rounded shadow-sm ${darkMode ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white'}`}>
                <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'bg-[#252525] border-gray-700' : 'bg-gray-50'}`}>
                  <input
                    type="text"
                    placeholder="Find hosted zones"
                    className={`border px-3 py-1.5 rounded text-sm w-72 outline-none ${darkMode ? 'bg-[#121212] border-gray-600 text-white' : 'bg-white'}`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{filteredZones.length} Zones</span>
                </div>

                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-xs uppercase ${darkMode ? 'bg-[#252525] border-gray-700 text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
                      <th className="p-4">Domain name</th>
                      <th className="p-4">Zone ID</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {filteredZones.length === 0 ? (
                      <tr><td colSpan={3} className="p-6 text-center text-gray-500">No hosted zones found.</td></tr>
                    ) : (
                      filteredZones.map((zone) => (
                        <tr key={zone.id} className={`hover:${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-50'}`}>
                          <td className="p-4 font-medium text-blue-500 cursor-pointer underline" onClick={() => setSelectedZone(zone)}>
                            {zone.name}
                          </td>
                          <td className="p-4 text-gray-400 text-xs font-mono">{zone.id}</td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDeleteZone(zone.id)} className="border border-red-300 text-red-500 px-3 py-1 rounded text-xs">
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
          )}

          {activeTab === "hosted-zones" && selectedZone && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <button onClick={() => setSelectedZone(null)} className="text-sm text-blue-500 underline mb-2 block">← Back to Hosted Zones</button>
                  <h1 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Records for: {selectedZone.name}</h1>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Zone ID: {selectedZone.id}</p>
                </div>
                <button onClick={() => setIsCreateRecordModal(true)} className="bg-[#ec7211] text-white font-medium px-4 py-2 rounded text-sm shadow">
                  Create record
                </button>
              </div>

              <div className={`border rounded shadow-sm ${darkMode ? 'bg-[#1e1e1e] border-gray-700' : 'bg-white'}`}>
                <div className={`p-4 border-b flex justify-between items-center ${darkMode ? 'bg-[#252525] border-gray-700' : 'bg-gray-50'}`}>
                  <input
                    type="text"
                    placeholder="Search records..."
                    className={`border px-3 py-1.5 rounded text-sm w-72 outline-none ${darkMode ? 'bg-[#121212] border-gray-600 text-white' : 'bg-white'}`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>{filteredRecords.length} Records</span>
                </div>

                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className={`border-b text-xs uppercase ${darkMode ? 'bg-[#252525] border-gray-700 text-gray-400' : 'bg-gray-50 text-gray-600'}`}>
                      <th className="p-4">Record name</th>
                      <th className="p-4">Type</th>
                      <th className="p-4">TTL</th>
                      <th className="p-4">Value / Routing</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-sm">
                    {filteredRecords.length === 0 ? (
                      <tr><td colSpan={5} className="p-6 text-center text-gray-500">No DNS records found.</td></tr>
                    ) : (
                      filteredRecords.map((rec) => (
                        <tr key={rec.id} className={`hover:${darkMode ? 'bg-[#2a2a2a]' : 'bg-gray-50'}`}>
                          <td className="p-4 font-medium">{rec.name}</td>
                          <td className="p-4 font-bold text-orange-500">{rec.type}</td>
                          <td className="p-4 text-gray-400">{rec.ttl}</td>
                          <td className="p-4 font-mono text-xs">{rec.value}</td>
                          <td className="p-4 text-right">
                            <button onClick={() => handleDeleteRecord(rec.id)} className="border border-red-300 text-red-500 px-3 py-1 rounded text-xs">
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
          )}

          {activeTab !== "hosted-zones" && (
            <div className={`border p-12 rounded shadow-sm text-center ${darkMode ? 'bg-[#1e1e1e] border-gray-700 text-gray-300' : 'bg-white text-gray-700'}`}>
              <h2 className="text-xl font-bold mb-2 capitalize">{activeTab.replace("-", " ")}</h2>
              <p className="text-sm opacity-60">Coming Soon - AWS Route 53 Console Experience</p>
            </div>
          )}
        </main>

        {/* Modal: Create Hosted Zone */}
        {isCreateZoneModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className={`rounded-lg shadow-lg w-full max-w-md p-6 ${darkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white text-black'}`}>
              <h3 className="text-lg font-bold mb-4">Create hosted zone</h3>
              <form onSubmit={handleCreateZone}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Domain name</label>
                  <input
                    type="text"
                    placeholder="example.com"
                    className={`w-full border p-2 rounded text-sm outline-none ${darkMode ? 'bg-[#121212] border-gray-600 text-white' : ''}`}
                    value={newZoneName}
                    onChange={(e) => setNewZoneName(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setIsCreateZoneModal(false)} className="border px-4 py-2 rounded text-sm">Cancel</button>
                  <button type="submit" className="bg-[#ec7211] text-white px-4 py-2 rounded text-sm">Create</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: Create DNS Record */}
        {isCreateRecordModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className={`rounded-lg shadow-lg w-full max-w-md p-6 ${darkMode ? 'bg-[#1e1e1e] text-white' : 'bg-white text-black'}`}>
              <h3 className="text-lg font-bold mb-4">Create record</h3>
              <form onSubmit={handleCreateRecord}>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Record name</label>
                  <input
                    type="text"
                    placeholder="www.example.com"
                    className={`w-full border p-2 rounded text-sm outline-none ${darkMode ? 'bg-[#121212] border-gray-600 text-white' : ''}`}
                    value={recName}
                    onChange={(e) => setRecName(e.target.value)}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">Record type</label>
                  <select
                    className={`w-full border p-2 rounded text-sm outline-none ${darkMode ? 'bg-[#121212] border-gray-600 text-white' : ''}`}
                    value={recType}
                    onChange={(e) => setRecType(e.target.value)}
                  >
                    {["A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA"].map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium mb-1">TTL (seconds)</label>
                  <input
                    type="number"
                    className={`w-full border p-2 rounded text-sm outline-none ${darkMode ? 'bg-[#121212] border-gray-600 text-white' : ''}`}
                    value={recTtl}
                    onChange={(e) => setRecTtl(Number(e.target.value))}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Value / IP Address / Target</label>
                  <input
                    type="text"
                    placeholder="192.0.2.1"
                    className={`w-full border p-2 rounded text-sm outline-none ${darkMode ? 'bg-[#121212] border-gray-600 text-white' : ''}`}
                    value={recValue}
                    onChange={(e) => setRecValue(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button type="button" onClick={() => setIsCreateRecordModal(false)} className="border px-4 py-2 rounded text-sm">Cancel</button>
                  <button type="submit" className="bg-[#ec7211] text-white px-4 py-2 rounded text-sm">Create records</button>
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
          <button type="submit" disabled={loading} className="w-full bg-[#ec7211] text-white p-2.5 rounded text-sm font-medium hover:bg-[#eb5f07]">
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}