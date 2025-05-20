"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchUserProfile, updateUserProfile, UserProfile } from "../lib/firestoreUsers";

export default function ProfileEditor(): React.ReactElement {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    birthday: "",
    anniversary: ""
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch profile info on mount
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchUserProfile(user.uid).then((profile: UserProfile | null) => {
      setProfile(profile);
      setForm({
        fullName: profile?.fullName || "",
        phone: profile?.phone || "",
        birthday: profile?.birthday || "",
        anniversary: profile?.anniversary || ""
      });
      setLoading(false);
    });
  }, [user]);

  // Change handler
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Track changes for Save button
  const hasChanges = profile &&
    (form.fullName !== (profile.fullName || "") ||
     form.phone !== (profile.phone || "") ||
     form.birthday !== (profile.birthday || "") ||
     form.anniversary !== (profile.anniversary || "")
    );

  // Submit handler
  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      await updateUserProfile(user!.uid, form);
      setSuccess("Profile updated!");
      setProfile({ ...profile!, ...form });
    } catch (err) {
      setError((err instanceof Error ? err.message : "Error saving profile."));
    }
    setSaving(false);
  }

  if (loading) return <div className="text-gray-600">Loading profile...</div>;

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-col gap-4 mb-6 bg-white border rounded-lg p-4 w-full max-w-md shadow"
    >
      <h2 className="text-xl font-semibold text-blue-700">Edit Your Profile</h2>
      <label className="font-medium">
        Full Name
        <input
          type="text"
          name="fullName"
          value={form.fullName}
          className="p-2 border border-gray-300 rounded w-full mt-1"
          onChange={handleChange}
          placeholder="Your name"
          required
        />
      </label>
      <label className="font-medium">
        Email
        <input
          type="email"
          value={user?.email || ""}
          className="p-2 border border-gray-200 rounded w-full mt-1 bg-gray-100"
          disabled
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
      <button
        type="submit"
        className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition disabled:opacity-60"
        disabled={saving || !hasChanges}
      >
        {saving ? "Saving..." : "Save"}
      </button>
      {success && <div className="text-green-600">{success}</div>}
      {error && <div className="text-red-600">{error}</div>}
    </form>
  );
}
