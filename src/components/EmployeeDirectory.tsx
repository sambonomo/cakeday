"use client";

import React, { useEffect, useState } from "react";
import { fetchAllUsers, UserProfile } from "../lib/firestoreUsers";
// Optional: only if you already have a UserAvatar component
import UserAvatar from "./UserAvatar";

interface EmployeeDirectoryProps {
  companyId: string;
}

export default function EmployeeDirectory({
  companyId,
}: EmployeeDirectoryProps) {
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
    .filter((e) => {
      const query = search.toLowerCase();
      const nameMatches =
        e.fullName && e.fullName.toLowerCase().includes(query);
      const emailMatches = e.email.toLowerCase().includes(query);
      return nameMatches || emailMatches;
    })
    .sort((a, b) => {
      // Sort by name, then by email
      const aName = (a.fullName || a.email || "").toLowerCase();
      const bName = (b.fullName || b.email || "").toLowerCase();
      return aName.localeCompare(bName);
    });

  if (loading) {
    return (
      <div className="text-gray-600 px-4 py-6">
        Loading employee directory...
      </div>
    );
  }

  return (
    <section className="card-panel max-w-5xl mx-auto mt-8">
      {/* Directory Header */}
      <h2 className="text-2xl font-semibold text-blue-700 mb-4">
        Employee Directory
      </h2>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full p-2 border border-gray-300 rounded"
        />
      </div>

      {/* No results */}
      {filtered.length === 0 && (
        <div className="text-gray-500">No employees found.</div>
      )}

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full border text-left text-sm">
          <thead>
            <tr className="bg-gray-100 text-gray-700">
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
              <tr key={e.uid} className="border-t hover:bg-gray-50">
                <td className="py-2 px-3 font-medium">
                  <div className="flex items-center gap-2">
                    {/* Avatar (optional) */}
                    {/** If you have a photoURL or a custom avatar: **/}
                    {e.photoURL && (
                      <UserAvatar
                        nameOrEmail={e.fullName || e.email}
                        photoURL={e.photoURL}
                        size={32}
                      />
                    )}
                    <span>{e.fullName || <span className="text-gray-400">—</span>}</span>
                  </div>
                </td>
                <td className="py-2 px-3">{e.email}</td>
                <td className="py-2 px-3">
                  {e.phone || <span className="text-gray-400">—</span>}
                </td>
                <td className="py-2 px-3">
                  {e.gender || <span className="text-gray-400">—</span>}
                </td>
                <td className="py-2 px-3">
                  {e.birthday ? (
                    new Date(e.birthday).toLocaleDateString()
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="py-2 px-3">
                  {e.anniversary ? (
                    new Date(e.anniversary).toLocaleDateString()
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="py-2 px-3">
                  {e.department || <span className="text-gray-400">—</span>}
                </td>
                <td className="py-2 px-3 capitalize">{e.role || "user"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden mt-4">
        {filtered.map((e) => {
          const displayName = e.fullName || e.email;
          return (
            <div
              key={e.uid}
              className="rounded-lg border border-gray-200 p-4 shadow-sm"
            >
              {/* Header Row: Avatar + Name */}
              <div className="flex items-center gap-3 mb-2">
                {/** If you have a photoURL or custom avatar: **/}
                {e.photoURL ? (
                  <UserAvatar
                    nameOrEmail={displayName}
                    photoURL={e.photoURL}
                    size={40}
                  />
                ) : (
                  /* fallback icon or initials if no photo? */
                  <div className="bg-gray-300 text-gray-700 rounded-full w-10 h-10 flex items-center justify-center uppercase font-semibold">
                    {displayName?.charAt(0) ?? "?"}
                  </div>
                )}
                <div className="font-semibold text-base text-blue-800">
                  {e.fullName || e.email}
                </div>
              </div>

              {/* Info Rows */}
              <div className="text-sm flex flex-col gap-1">
                <div>
                  <span className="font-medium">Email: </span>
                  {e.email}
                </div>
                <div>
                  <span className="font-medium">Phone: </span>
                  {e.phone || <span className="text-gray-400">—</span>}
                </div>
                <div>
                  <span className="font-medium">Gender: </span>
                  {e.gender || <span className="text-gray-400">—</span>}
                </div>
                <div>
                  <span className="font-medium">Birthday: </span>
                  {e.birthday ? (
                    new Date(e.birthday).toLocaleDateString()
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
                <div>
                  <span className="font-medium">Anniversary: </span>
                  {e.anniversary ? (
                    new Date(e.anniversary).toLocaleDateString()
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </div>
                <div>
                  <span className="font-medium">Department: </span>
                  {e.department || <span className="text-gray-400">—</span>}
                </div>
                <div>
                  <span className="font-medium">Role: </span>
                  {e.role ? e.role.toLowerCase() : "user"}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
