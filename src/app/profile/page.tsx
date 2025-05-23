"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchUserProfile, UserProfile } from "../../lib/firestoreUsers";
import UserAvatar from "../../components/UserAvatar";
import ProfileEditor from "../../components/ProfileEditor";
import Toast from "../../components/Toast";
import { Sparkles, Cake, PartyPopper, Phone } from "lucide-react";

export default function ProfilePage(): React.ReactElement {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchUserProfile(user.uid).then((pf) => {
      setProfile(pf);
      setLoading(false);
    });
  }, [user, editing]);

  function handleEditDone(updated?: boolean, errMsg?: string) {
    setEditing(false);
    if (updated) setSuccess("Profile updated!");
    if (errMsg) setError(errMsg);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-white via-brand-50 to-accent-50">
        <div className="text-lg text-brand-600 animate-pulse">
          Loading profile...
        </div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white via-brand-50 to-accent-50">
        <div className="bg-white/90 p-8 rounded-2xl shadow-2xl">
          <div className="text-red-500 font-bold text-lg">
            User not found or not logged in.
          </div>
        </div>
      </div>
    );
  }

  if (editing) {
    return (
      <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-white via-brand-50 to-accent-50 pt-12">
        <ProfileEditor onDone={handleEditDone} />
        <button
          className="mt-4 text-brand-600 underline text-sm"
          onClick={() => setEditing(false)}
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-white via-brand-50 to-accent-50 px-4 py-12">
      <main className="bg-white/95 rounded-3xl shadow-2xl p-10 w-full max-w-lg flex flex-col items-center animate-fade-in">
        <div className="flex flex-col items-center gap-2">
          <div className="relative mb-4">
            <UserAvatar
              nameOrEmail={profile.fullName || profile.email}
              photoURL={
                typeof profile.photoURL === "string"
                  ? profile.photoURL
                  : undefined
              }
              size={96}
              className="shadow-lg border-4 border-brand-100"
            />
            <span
              className="absolute -bottom-2 right-1 bg-brand-600 text-white rounded-full px-3 py-1 text-xs font-bold shadow flex items-center gap-1"
              title="Profile Complete"
            >
              <Sparkles className="w-4 h-4" /> {/* Lucide sparkle, no emoji */}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold text-brand-700 mb-1 text-center">
            {profile.fullName || "(No Name)"}
          </h1>
          <div className="text-gray-500 mb-2 text-center">{profile.email}</div>

          <div className="flex flex-col items-center gap-1 text-gray-600 text-base mb-3">
            {profile.birthday && (
              <div className="flex items-center gap-2">
                <Cake className="w-4 h-4 text-yellow-400" />
                <span>Birthday:</span>{" "}
                <span className="font-medium">
                  {new Date(profile.birthday).toLocaleDateString()}
                </span>
              </div>
            )}
            {profile.anniversary && (
              <div className="flex items-center gap-2">
                <PartyPopper className="w-4 h-4 text-pink-500" />
                <span>Work Anniversary:</span>{" "}
                <span className="font-medium">
                  {new Date(profile.anniversary).toLocaleDateString()}
                </span>
              </div>
            )}
            {profile.phone && (
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-blue-400" />
                <span>{profile.phone}</span>
              </div>
            )}
          </div>

          {/* Edit Profile Button */}
          <button
            className="
              mt-2 px-8 py-2
              bg-brand-600 text-white
              rounded-xl font-bold shadow
              hover:bg-brand-700 transition text-lg flex items-center gap-2
            "
            onClick={() => setEditing(true)}
          >
            <Sparkles className="w-5 h-5" /> Edit Profile
          </button>
        </div>

        {/* Toast feedback */}
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
      </main>
    </div>
  );
}
