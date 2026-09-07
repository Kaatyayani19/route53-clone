"use client";
import { useState, useEffect } from "react";

export default function Home() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState("");
  const [hostedZones, setHostedZones] = useState([]);
  const [newDomain, setNewDomain] = useState("");
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [checkingSession, setCheckingSession] = useState(true);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://route53-clone-1-0xn7.onrender.com";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Invalid credentials");
      const data = await res.json();
      setIsLoggedIn(true);
      setCurrentUser(data.username);
      fetchZones();
    } catch (err: any) {
      setError(err.message || "Login failed");
    }
  };

  const handleLogout = async () => {
    await fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" });
    setIsLoggedIn(false);
    setCurrentUser("");
  };

  const fetchZones = async () => {
    try {
      const res = await fetch(`${API_URL}/hosted-zones/`, { credentials: "include" });
      const data = await res.json();
      setHostedZones(data);
    } catch (err) {
      console.error("Failed to fetch zones");
    }
  };

  const createZone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/hosted-zones/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain_name: newDomain, comment }),
        credentials: "include",
      });
      if (res.ok) {
        setNewDomain("");
        setComment("");
        fetchZones();
      }
    } catch (err) {
      console.error("Failed to create zone");
    }
  };

  if (!isLoggedIn) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <form onSubmit={handleLogin} className="p-8 bg-white shadow-md rounded-lg w-96">
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Route 53 Login</h1>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div className="mb-4">
            <label className="block text-gray-700 text-sm mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-2 border rounded text-black"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-2 border rounded text-black"
              required
            />
          </div>
          <button type="submit" className="w-full bg-orange-600 text-white p-2 rounded hover:bg-orange-700">
            Log In
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="p-8 bg-gray-100 min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Amazon Route 53</h1>
          <p className="text-sm text-gray-600">Logged in as: <b>{currentUser}</b></p>
        </div>
        <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
          Logout
        </button>
      </div>

      <div className="bg-white p-6 rounded shadow-md mb-6">
        <h2 className="text-xl font-semibold mb-4 text-black">Create Hosted Zone</h2>
        <form onSubmit={createZone} className="flex gap-4">
          <input
            type="text"
            placeholder="Domain name (e.g., example.com)"
            value={newDomain}
            onChange={(e) => setNewDomain(e.target.value)}
            className="p-2 border rounded flex-1 text-black"
            required
          />
          <input
            type="text"
            placeholder="Comment (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="p-2 border rounded flex-1 text-black"
          />
          <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded hover:bg-orange-700">
            Create
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded shadow-md">
        <h2 className="text-xl font-semibold mb-4 text-black">Hosted Zones ({hostedZones.length})</h2>
        <ul className="divide-y divide-gray-200">
          {hostedZones.map((zone: any) => (
            <li key={zone.id} className="py-3 flex justify-between text-black">
              <span>{zone.domain_name}</span>
              <span className="text-gray-500">{zone.comment || "No comment"}</span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}