"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchUserProfile, updateUserProfile, UserProfile } from "../lib/firestoreUsers";

export default function ProfileEditor(): JSX.Element {
  const { user } = useAuth();
  const [birthday, setBirthday] = useState<string>("");
  const [anniversary, setAnniversary] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchUserProfile(user.uid).then((profile: UserProfile | null) => {
      setBirthday(profile?.birthday || "");
      setAnniversary(profile?.anniversary || "");
      setLoading(false);
    });
  }, [user]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);
    try {
      await updateUserProfile(user!.uid, { birthday, anniversary });
      setSuccess("Profile updated!");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Error saving profile.");
      } else {
        setError("Error saving profile.");
      }
    }
    setSaving(false);
  };

  if (loading) return <div className="text-gray-600">Loading profile...</div>;

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-col gap-4 mb-6 bg-white border rounded-lg p-4 w-full max-w-md shadow"
    >
      <h2 className="text-xl font-semibold text-blue-700">Edit Your Profile</h2>
      <label className="font-medium">
        Birthday
        <input
          type="date"
          value={birthday}
          className="p-2 border border-gray-300 rounded w-full mt-1"
          onChange={e => setBirthday(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          required
        />
      </label>
      <label className="font-medium">
        Work Anniversary
        <input
          type="date"
          value={anniversary}
          className="p-2 border border-gray-300 rounded w-full mt-1"
          onChange={e => setAnniversary(e.target.value)}
          max={new Date().toISOString().split("T")[0]}
          required
        />
      </label>
      <button
        type="submit"
        className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition"
        disabled={saving}
      >
        {saving ? "Saving..." : "Save"}
      </button>
      {success && <div className="text-green-600">{success}</div>}
      {error && <div className="text-red-600">{error}</div>}
    </form>
  );
}
