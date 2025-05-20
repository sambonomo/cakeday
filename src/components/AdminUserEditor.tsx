import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { fetchAllUsers, updateUserProfile, UserProfile } from "../lib/firestoreUsers";
import { useAuth } from "../context/AuthContext";

const ROLES = ["user", "admin", "manager"];

type FormState = {
  fullName: string;
  phone: string;
  birthday: string;
  anniversary: string;
  role: string;
  email: string;
};

export default function AdminUserEditor(): React.ReactElement {
  const { companyId } = useAuth();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    fullName: "",
    phone: "",
    birthday: "",
    anniversary: "",
    role: "user",
    email: "",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch all users once companyId is available
  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    fetchAllUsers(companyId)
      .then((users) => {
        setUsers(users);
        setLoading(false);
      })
      .catch(() => {
        setError("Error fetching users.");
        setLoading(false);
      });
  }, [companyId]);

  // When a user is selected, populate form
  useEffect(() => {
    if (!selectedUserId) return;
    const user = users.find((u) => u.uid === selectedUserId);
    if (user) {
      setForm({
        fullName: user.fullName || "",
        phone: user.phone || "",
        birthday: user.birthday || "",
        anniversary: user.anniversary || "",
        role: user.role || "user",
        email: user.email || "",
      });
      setSuccess(null);
      setError(null);
    }
  }, [selectedUserId, users]);

  // Form change handler
  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  // Save handler
  async function handleSave(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedUserId) return;
    setSaving(true);
    setSuccess(null);
    setError(null);

    // Only update editable fields (not email)
    const updates = {
      fullName: form.fullName,
      phone: form.phone,
      birthday: form.birthday,
      anniversary: form.anniversary,
      role: form.role,
    };
    try {
      await updateUserProfile(selectedUserId, updates);
      setSuccess("User profile updated!");
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === selectedUserId ? { ...u, ...updates } : u
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating user.");
    }
    setSaving(false);
  }

  if (!companyId) {
    return (
      <div className="text-gray-500 mt-8">
        Loading admin info...
      </div>
    );
  }

  if (loading) return <div className="text-gray-600">Loading users...</div>;

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* User List */}
      <div className="w-full md:w-1/2">
        <h2 className="text-xl font-semibold text-blue-700 mb-2">All Users</h2>
        <ul className="bg-white rounded shadow divide-y border max-h-[70vh] overflow-y-auto">
          {users.length === 0 && (
            <li className="p-3 text-gray-400 italic">No users found in this company.</li>
          )}
          {users.map((u) => (
            <li
              key={u.uid}
              className={`p-3 cursor-pointer hover:bg-blue-50 ${selectedUserId === u.uid ? "bg-blue-100 font-semibold" : ""}`}
              onClick={() => setSelectedUserId(u.uid)}
              aria-selected={selectedUserId === u.uid}
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") setSelectedUserId(u.uid);
              }}
            >
              <div>
                {u.fullName || "(No name)"}{" "}
                <span className="text-xs text-gray-500">({u.email})</span>
              </div>
              <div className="text-xs text-gray-400">{u.role || "user"}</div>
            </li>
          ))}
        </ul>
      </div>

      {/* Editor */}
      <div className="w-full md:w-1/2">
        {selectedUserId ? (
          <form
            onSubmit={handleSave}
            className="flex flex-col gap-4 bg-white border rounded-lg p-4 w-full max-w-md shadow"
            autoComplete="off"
          >
            <h3 className="text-lg font-medium text-blue-700 mb-2">Edit User Profile</h3>
            <label className="font-medium">
              Full Name
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                className="p-2 border border-gray-300 rounded w-full mt-1"
                onChange={handleChange}
                placeholder="Full Name"
                required
              />
            </label>
            <label className="font-medium">
              Email
              <input
                type="email"
                name="email"
                value={form.email}
                className="p-2 border border-gray-200 rounded w-full mt-1 bg-gray-100"
                disabled
                readOnly
              />
            </label>
            <label className="font-medium">
              Phone Number
              <input
                type="tel"
                name="phone"
                value={form.phone}
                className="p-2 border border-gray-300 rounded w-full mt-1"
                onChange={handleChange}
                placeholder="e.g. (555) 123-4567"
              />
            </label>
            <label className="font-medium">
              Birthday
              <input
                type="date"
                name="birthday"
                value={form.birthday}
                className="p-2 border border-gray-300 rounded w-full mt-1"
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </label>
            <label className="font-medium">
              Work Anniversary
              <input
                type="date"
                name="anniversary"
                value={form.anniversary}
                className="p-2 border border-gray-300 rounded w-full mt-1"
                onChange={handleChange}
                max={new Date().toISOString().split("T")[0]}
                required
              />
            </label>
            <label className="font-medium">
              Role
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="p-2 border border-gray-300 rounded w-full mt-1"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="submit"
              className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition disabled:opacity-60"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            {success && <div className="text-green-600">{success}</div>}
            {error && <div className="text-red-600">{error}</div>}
          </form>
        ) : (
          <div className="text-gray-500 mt-8">Select a user to edit their profile.</div>
        )}
      </div>
    </div>
  );
}
