"use client";

import { useEffect, useState } from "react";
import { fetchAllUsers, UserProfile } from "../lib/firestoreUsers";

interface EmployeeDirectoryProps {
  companyId: string;
}

export default function EmployeeDirectory({ companyId }: EmployeeDirectoryProps) {
  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    const load = async () => {
      setLoading(true);
      const users = await fetchAllUsers(companyId);
      setEmployees(users);
      setLoading(false);
    };
    load();
  }, [companyId]);

  const filtered = employees
    .filter(
      (e) =>
        e.email.toLowerCase().includes(search.toLowerCase()) ||
        (e.fullName && e.fullName.toLowerCase().includes(search.toLowerCase()))
    )
    .sort((a, b) => {
      // Sort by name, then by email
      const aName = (a.fullName || a.email || "").toLowerCase();
      const bName = (b.fullName || b.email || "").toLowerCase();
      return aName.localeCompare(bName);
    });

  if (loading)
    return <div className="text-gray-600">Loading employee directory...</div>;

  return (
    <div className="w-full max-w-5xl mx-auto bg-white rounded-lg shadow p-6 mt-8">
      <h2 className="text-2xl font-semibold text-blue-700 mb-4">Employee Directory</h2>
      <input
        type="text"
        placeholder="Search by name or email"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 w-full p-2 border border-gray-300 rounded"
      />
      {filtered.length === 0 && (
        <div className="text-gray-500">No employees found.</div>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full border text-left text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3">Name</th>
              <th className="py-2 px-3">Email</th>
              <th className="py-2 px-3">Phone</th>
              <th className="py-2 px-3">Gender</th>
              <th className="py-2 px-3">Birthday</th>
              <th className="py-2 px-3">Anniversary</th>
              <th className="py-2 px-3">Department</th>
              <th className="py-2 px-3">Role</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e.uid} className="border-t">
                <td className="py-2 px-3 font-medium">{e.fullName || <span className="text-gray-400">—</span>}</td>
                <td className="py-2 px-3">{e.email}</td>
                <td className="py-2 px-3">{e.phone || <span className="text-gray-400">—</span>}</td>
                <td className="py-2 px-3">{e.gender || <span className="text-gray-400">—</span>}</td>
                <td className="py-2 px-3">
                  {e.birthday
                    ? new Date(e.birthday).toLocaleDateString()
                    : <span className="text-gray-400">—</span>}
                </td>
                <td className="py-2 px-3">
                  {e.anniversary
                    ? new Date(e.anniversary).toLocaleDateString()
                    : <span className="text-gray-400">—</span>}
                </td>
                <td className="py-2 px-3">{e.department || <span className="text-gray-400">—</span>}</td>
                <td className="py-2 px-3 capitalize">{e.role || "user"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
