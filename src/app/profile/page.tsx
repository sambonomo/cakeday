"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchUserProfile, UserProfile } from "../../lib/firestoreUsers";
import UserAvatar from "../../components/UserAvatar";
import ProfileEditor from "../../components/ProfileEditor";

export default function ProfilePage(): React.ReactElement {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchUserProfile(user.uid).then((profile) => {
      setProfile(profile);
      setLoading(false);
    });
  }, [user, editing]);

  if (loading) {
    return <div className="text-gray-600">Loading profile...</div>;
  }

  if (!user || !profile) {
    return <div className="text-red-500">User not found or not logged in.</div>;
  }

  if (editing) {
    // Show the profile editor
    return (
      <div className="flex flex-col items-center mt-8">
        <ProfileEditor />
        <button
          className="mt-4 text-blue-600 underline text-sm"
          onClick={() => setEditing(false)}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center mt-10">
      <UserAvatar
        nameOrEmail={profile.fullName || profile.email}
        photoURL={typeof profile.photoURL === "string" ? profile.photoURL : undefined}
        size={80}
        className="mb-4"
      />
      <h1 className="text-2xl font-bold mb-1">{profile.fullName || "(No Name)"}</h1>
      <div className="text-gray-600 mb-2">{profile.email}</div>
      <div className="text-gray-500 text-sm mb-2">
        {profile.birthday && (
          <div>🎂 Birthday: {new Date(profile.birthday).toLocaleDateString()}</div>
        )}
        {profile.anniversary && (
          <div>🎉 Work Anniversary: {new Date(profile.anniversary).toLocaleDateString()}</div>
        )}
        {profile.phone && (
          <div>📞 Phone: {profile.phone}</div>
        )}
      </div>
      {/* Add stats or kudos info here if you want */}
      <button
        className="mt-2 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
        onClick={() => setEditing(true)}
      >
        Edit Profile
      </button>
    </div>
  );
}
