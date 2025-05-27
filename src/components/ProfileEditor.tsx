"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchUserProfile, updateUserProfile, UserProfile } from "../lib/firestoreUsers";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import UserAvatar from "./UserAvatar";

export default function ProfileEditor({
  onDone,
}: {
  onDone?: (updated?: boolean, errMsg?: string) => void;
}): React.ReactElement {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    birthday: "",
    anniversary: "",
  });
  const [photoURL, setPhotoURL] = useState<string>("");
  const [preview, setPreview] = useState<string>("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        anniversary: profile?.anniversary || "",
      });
      setPhotoURL(profile?.photoURL || "");
      setPreview(profile?.photoURL || "");
      setLoading(false);
    });
  }, [user]);

  // Change handler
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // Track changes for Save button
  const hasChanges =
    profile &&
    (form.fullName !== (profile.fullName || "") ||
      form.phone !== (profile.phone || "") ||
      form.birthday !== (profile.birthday || "") ||
      form.anniversary !== (profile.anniversary || "") ||
      photoFile);

  // Handle photo change
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (file) {
      setPhotoFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  // Submit handler
  async function handleSave(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setSuccess(null);
    setError(null);

    let uploadedPhotoURL = photoURL;

    // If a new photo is selected, upload it
    if (photoFile) {
      try {
        const storage = getStorage();
        const storageRef = ref(storage, `user-profiles/${user!.uid}/${photoFile.name}`);
        await uploadBytes(storageRef, photoFile);
        uploadedPhotoURL = await getDownloadURL(storageRef);
        setPhotoURL(uploadedPhotoURL);
      } catch (uploadErr) {
        setError("Failed to upload photo.");
        setSaving(false);
        if (onDone) onDone(false, "Failed to upload photo.");
        return;
      }
    }

    try {
      await updateUserProfile(user!.uid, {
        ...form,
        photoURL: uploadedPhotoURL,
      });
      setSuccess("Profile updated!");
      setProfile({ ...profile!, ...form, photoURL: uploadedPhotoURL });
      setPhotoFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (onDone) onDone(true);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Error saving profile.";
      setError(errMsg);
      if (onDone) onDone(false, errMsg);
    }
    setSaving(false);
  }

  if (loading) return <div className="text-gray-600">Loading profile...</div>;

  return (
    <form
      onSubmit={handleSave}
      className="flex flex-col gap-4 mb-6 bg-white border rounded-lg p-4 w-full max-w-md shadow"
      aria-label="Edit your profile"
      autoComplete="off"
    >
      <h2 className="text-xl font-semibold text-blue-700 mb-2">Edit Your Profile</h2>
      {/* Profile Photo Upload */}
      <label className="font-medium flex flex-col gap-2" htmlFor="photo-upload">
        Profile Photo
        <div className="flex items-center gap-4">
          {preview ? (
            <img
              src={preview}
              alt="Profile Preview"
              className={`rounded-full border object-cover ${saving ? "opacity-50" : ""}`}
              style={{ width: 64, height: 64 }}
            />
          ) : (
            <UserAvatar nameOrEmail={user?.fullName || user?.email || "?"} size={64} />
          )}
          <input
            id="photo-upload"
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="text-sm"
            disabled={saving}
            aria-label="Upload profile photo"
          />
        </div>
      </label>
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
        />
      </label>
      <button
        type="submit"
        className="bg-blue-600 text-white rounded px-4 py-2 hover:bg-blue-700 transition disabled:opacity-60"
        disabled={saving || !hasChanges}
        aria-disabled={saving || !hasChanges}
      >
        {saving ? "Saving..." : "Save"}
      </button>
      {!onDone && success && (
        <div className="text-green-600" role="status">{success}</div>
      )}
      {!onDone && error && (
        <div className="text-red-600" role="alert">{error}</div>
      )}
    </form>
  );
}
