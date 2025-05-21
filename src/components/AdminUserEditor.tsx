"use client";

import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { fetchAllUsers, updateUserProfile, UserProfile } from "../lib/firestoreUsers";
import { useAuth } from "../context/AuthContext";
import Toast from "./Toast";
import UserAvatar from "./UserAvatar";

const ROLES = ["user", "admin", "manager"];
const GENDERS = ["", "Male", "Female", "Nonbinary", "Other", "Prefer not to say"];
const STATUS_OPTIONS = [
  { value: "newHire", label: "New Hire" },
  { value: "active", label: "Active" },
  { value: "exiting", label: "Exiting" },
];

type FormState = {
  fullName: string;
  phone: string;
  birthday: string;
  anniversary: string;
  role: string;
  email: string;
  photoURL?: string;
  disabled?: boolean;
  gender: string;
  department: string;
  status: string; // "newHire" | "active" | "exiting"
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
    photoURL: "",
    disabled: false,
    gender: "",
    department: "",
    status: "active",
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
        photoURL: typeof user.photoURL === "string" ? user.photoURL : "",
        disabled: !!user.disabled,
        gender: user.gender || "",
        department: user.department || "",
        status: user.status || "active",
      });
      setSuccess(null);
      setError(null);
    }
  }, [selectedUserId, users]);

  // Form change handler
  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value, type, checked } = e.target as any;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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
      photoURL: form.photoURL,
      disabled: !!form.disabled,
      gender: form.gender,
      department: form.department,
      status: form.status,
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

  // Disable/enable user handler
  async function handleToggleDisable() {
    if (!selectedUserId) return;
    const newDisabled = !form.disabled;
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      await updateUserProfile(selectedUserId, { disabled: newDisabled });
      setForm((prev) => ({ ...prev, disabled: newDisabled }));
      setSuccess(
        newDisabled ? "User disabled. They will not be able to log in." : "User re-enabled."
      );
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === selectedUserId ? { ...u, disabled: newDisabled } : u
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error updating user status.");
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
              className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-blue-50 ${selectedUserId === u.uid ? "bg-blue-100 font-semibold" : ""} ${u.disabled ? "opacity-50" : ""}`}
              onClick={() => setSelectedUserId(u.uid)}
              aria-selected={selectedUserId === u.uid}
              tabIndex={0}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") setSelectedUserId(u.uid);
              }}
            >
              <UserAvatar
                nameOrEmail={u.fullName || u.email}
                photoURL={typeof u.photoURL === "string" ? u.photoURL : undefined}
                size={36}
              />
              <div>
                <div>
                  {u.fullName || "(No name)"}{" "}
                  <span className="text-xs text-gray-500">({u.email})</span>
                  {u.disabled && (
                    <span className="ml-2 text-xs font-bold text-red-500">(Disabled)</span>
                  )}
                </div>
                <div className="text-xs text-gray-400">{u.role || "user"}</div>
              </div>
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
            {form.photoURL && (
              <div className="flex justify-center">
                <UserAvatar
                  nameOrEmail={form.fullName || form.email}
                  photoURL={form.photoURL}
                  size={64}
                />
              </div>
            )}
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
            <label className="font-medium">
              Gender
              <select
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="p-2 border border-gray-300 rounded w-full mt-1"
              >
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g === "" ? "Select gender..." : g}
                  </option>
                ))}
              </select>
            </label>
            <label className="font-medium">
              Department
              <input
                type="text"
                name="department"
                value={form.department}
                onChange={handleChange}
                className="p-2 border border-gray-300 rounded w-full mt-1"
                placeholder="Department"
              />
            </label>
            <label className="font-medium">
              Status
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="p-2 border border-gray-300 rounded w-full mt-1"
                required
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <div className="text-xs text-gray-400 mt-1">
                <span>
                  {" "}
                  - New Hire: Employee in onboarding
                </span>
                <br />
                <span>
                  {" "}
                  - Active: Current team member
                </span>
                <br />
                <span>
                  {" "}
                  - Exiting: Leaving company (offboarding)
                </span>
              </div>
            </label>
            {/* Disable/Enable button */}
            <button
              type="button"
              className={`mt-2 px-4 py-2 rounded ${
                form.disabled ? "bg-green-500 hover:bg-green-600" : "bg-gray-500 hover:bg-gray-700"
              } text-white transition`}
              onClick={handleToggleDisable}
              disabled={saving}
            >
              {form.disabled ? "Re-enable User" : "Disable User"}
            </button>
            <button
              type="submit"
              className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition disabled:opacity-60 mt-2"
              disabled={saving}
            >
              {saving ? "Saving..." : "Save"}
            </button>
            {success && (
              <Toast
                message={success}
                type="success"
                onClose={() => setSuccess(null)}
              />
            )}
            {error && (
              <Toast
                message={error}
                type="error"
                onClose={() => setError(null)}
              />
            )}
          </form>
        ) : (
          <div className="text-gray-500 mt-8">Select a user to edit their profile.</div>
        )}
      </div>
    </div>
  );
}
