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

  // Fetch hosted zones when logged in
  useEffect(() => {
    if (isLoggedIn) {
      fetch(`${API_URL}/api/hosted-zones`, {
        credentials: "include",
      })
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setHostedZones(data);
          } else {
            setHostedZones([]);
          }
        })
        .catch((err) => console.error("Failed to fetch zones", err));
    }
  }, [isLoggedIn]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Login failed");
      }

      setIsLoggedIn(true);
    } catch (err: any) {
      setError("Failed to fetch: Invalid credentials or server error.");
    } finally {
      setLoading(false);
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

  if (isLoggedIn) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Route 53 Dashboard</h1>
          <button onClick={handleLogout} className="bg-red-500 text-white px-4 py-2 rounded">
            Log Out
          </button>
        </div>
        <div className="border p-6 rounded shadow-sm bg-white">
          <h2 className="text-lg font-semibold mb-4">Hosted Zones</h2>
          {hostedZones.length === 0 ? (
            <p className="text-gray-500">No hosted zones found.</p>
          ) : (
            <ul className="divide-y">
              {hostedZones.map((zone, index) => (
                <li key={index} className="py-2 flex justify-between">
                  <span>{zone.name}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
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