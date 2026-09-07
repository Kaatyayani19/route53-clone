"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { API_BASE_URL } from "@/config/api";

interface DnsRecord {
  id: string;
  name: string;
  type: string;
  ttl: number;
  value: string;
}

interface HostedZone {
  id: string;
  name: string;
  comment: string | null;
  record_count: number;
}

export default function ZoneDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const zoneId = params.id as string;

  const [zone, setZone] = useState<HostedZone | null>(null);
  const [records, setRecords] = useState<DnsRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state for new DNS record
  const [recordName, setRecordName] = useState("");
  const [recordType, setRecordType] = useState("A");
  const [recordTtl, setRecordTtl] = useState(300);
  const [recordValue, setRecordValue] = useState("");

  const fetchZoneDetails = async () => {
    try {
      setLoading(true);
      const zoneRes = await fetch(`http://localhost:8000/api/hosted-zones/${zoneId}`);
      if (!zoneRes.ok) throw new Error("Failed to fetch hosted zone details");
      const zoneData = await zoneRes.json();
      setZone(zoneData);

      const recordsRes = await fetch(`http://localhost:8000/api/hosted-zones/${zoneId}/records`);
      if (!recordsRes.ok) throw new Error("Failed to fetch DNS records");
      const recordsData = await recordsRes.json();
      setRecords(recordsData);

      setError(null);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (zoneId) {
      fetchZoneDetails();
    }
  }, [zoneId]);

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordName || !recordValue) return;

    try {
      const res = await fetch(`http://localhost:8000/api/hosted-zones/${zoneId}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: recordName,
          type: recordType,
          ttl: Number(recordTtl),
          value: recordValue,
        }),
      });

      if (!res.ok) throw new Error("Failed to create DNS record");

      setRecordName("");
      setRecordValue("");
      fetchZoneDetails(); // Refresh list
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    if (!confirm("Are you sure you want to delete this DNS record?")) return;

    try {
      const res = await fetch(`http://localhost:8000/api/hosted-zones/${zoneId}/records/${recordId}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Failed to delete DNS record");
      fetchZoneDetails();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8">
      <div className="max-w-6xl mx-auto">
        <button
          onClick={() => router.push("/")}
          className="text-sm text-orange-600 hover:underline mb-4 inline-block font-medium"
        >
          &larr; Back to Hosted Zones
        </button>

        <header className="border-b pb-4 mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-orange-600">
              {zone ? zone.name : "Loading Zone..."}
            </h1>
            <p className="text-sm text-gray-600">Manage DNS records for this hosted zone</p>
          </div>
          <span className="text-xs bg-orange-100 text-orange-800 px-3 py-1 rounded-full font-medium">
            Zone ID: {zoneId}
          </span>
        </header>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 text-red-700 text-sm">
            Error: {error}
          </div>
        )}

        {/* Create DNS Record Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <h2 className="text-lg font-semibold mb-4">Create DNS Record</h2>
          <form onSubmit={handleCreateRecord} className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <input
              type="text"
              placeholder="Record name (e.g., www)"
              value={recordName}
              onChange={(e) => setRecordName(e.target.value)}
              className="border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <select
              value={recordType}
              onChange={(e) => setRecordType(e.target.value)}
              className="border rounded p-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="A">A</option>
              <option value="AAAA">AAAA</option>
              <option value="CNAME">CNAME</option>
              <option value="MX">MX</option>
              <option value="TXT">TXT</option>
            </select>
            <input
              type="number"
              placeholder="TTL (seconds)"
              value={recordTtl}
              onChange={(e) => setRecordTtl(Number(e.target.value))}
              className="border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <input
              type="text"
              placeholder="Value / IP (e.g., 192.0.2.1)"
              value={recordValue}
              onChange={(e) => setRecordValue(e.target.value)}
              className="border rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              required
            />
            <button
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded text-sm transition"
            >
              Create Record
            </button>
          </form>
        </div>

        {/* DNS Records Table */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="p-4 border-b bg-gray-50">
            <h2 className="font-semibold">DNS Records ({records.length})</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-gray-500">Loading DNS records...</div>
          ) : records.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No DNS records found for this zone. Create one above!</div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b bg-gray-100 text-gray-600">
                  <th className="p-3">Record Name</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">TTL</th>
                  <th className="p-3">Value</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium text-blue-600">{rec.name}</td>
                    <td className="p-3 font-semibold">{rec.type}</td>
                    <td className="p-3 text-gray-600">{rec.ttl}</td>
                    <td className="p-3 text-gray-800 font-mono text-xs">{rec.value}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteRecord(rec.id)}
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