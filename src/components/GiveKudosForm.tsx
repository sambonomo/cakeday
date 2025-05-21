"use client";

import React, { useState, useEffect } from "react";
import { giveKudos } from "../lib/firestoreRecognition";
import { useAuth } from "../context/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { UserProfile } from "../lib/firestoreUsers";
import UserAvatar from "./UserAvatar";

const BADGES = [
  { label: "Team Player", emoji: "🤝" },
  { label: "Innovator", emoji: "💡" },
  { label: "Leadership", emoji: "🦸" },
  { label: "Extra Mile", emoji: "🏅" },
  { label: "Problem Solver", emoji: "🧠" },
  { label: "Cheerleader", emoji: "🎉" },
  { label: "Rockstar", emoji: "🎸" },
  { label: "Customer Hero", emoji: "🏆" },
  { label: "Sharp Shooter", emoji: "🎯" },
  { label: "Kindness", emoji: "💖" },
];

interface GiveKudosFormProps {
  companyId?: string;
}

export default function GiveKudosForm({
  companyId: propCompanyId,
}: GiveKudosFormProps): React.ReactElement {
  const { user, companyId: contextCompanyId } = useAuth();
  const companyId = propCompanyId || contextCompanyId;

  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [toUid, setToUid] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [badge, setBadge] = useState<string>(BADGES[0].emoji);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!companyId || !user) return;
    const fetchEmployees = async () => {
      const usersQuery = query(
        collection(db, "users"),
        where("companyId", "==", companyId)
      );
      const snapshot = await getDocs(usersQuery);
      const list: UserProfile[] = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as UserProfile[];
      setEmployees(list.filter((e) => e.uid !== user?.uid));
    };
    fetchEmployees();
  }, [user?.uid, companyId, user]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    setLoading(true);

    if (!companyId || !user) {
      setError("Missing company information. Please log in again.");
      setLoading(false);
      return;
    }

    const recipient = employees.find((e) => e.uid === toUid);
    if (!recipient || !message.trim()) {
      setError("Please select a recipient and write a message.");
      setLoading(false);
      return;
    }

    // TypeScript/ESLint safe: direct access, no in checks
    const fromName = user.fullName ?? user.email ?? "";
    const fromPhotoURL = user.photoURL ?? "";
    const toName = recipient.fullName || recipient.email;
    // Safe photoURL: only string or undefined, never object
    const toPhotoURL =
      typeof recipient.photoURL === "string" ? recipient.photoURL : undefined;

    try {
      await giveKudos({
        fromUid: user.uid,
        fromEmail: user.email!,
        toUid: recipient.uid,
        toEmail: recipient.email,
        message: message.trim(),
        badge,
        companyId,
        fromName,
        fromPhotoURL,
        toName,
        toPhotoURL,
      });
      setSuccess("Kudos sent!");
      setToUid("");
      setMessage("");
      setBadge(BADGES[0].emoji);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Error sending kudos.");
      } else {
        setError("Error sending kudos.");
      }
    }
    setLoading(false);
  };

  // Get recipient profile for avatar
  const selectedEmployee = employees.find((e) => e.uid === toUid);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 mb-6">
      <h3 className="font-semibold text-blue-700">Give Kudos</h3>

      {/* Badge/Emoji Picker */}
      <div>
        <label className="block font-medium mb-1">Badge</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {BADGES.map((b) => (
            <button
              key={b.emoji}
              type="button"
              className={`px-2 py-1 rounded border text-lg transition ${
                badge === b.emoji
                  ? "bg-green-200 border-green-500"
                  : "bg-gray-100 border-gray-300"
              }`}
              aria-label={b.label}
              onClick={() => setBadge(b.emoji)}
            >
              <span role="img" aria-label={b.label}>
                {b.emoji}
              </span>
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-600 mb-2">
          Selected:{" "}
          <span className="font-semibold">
            {BADGES.find((b) => b.emoji === badge)?.label}
          </span>
        </div>
      </div>

      {/* Recipient selection */}
      <label className="font-medium">
        Recipient
        <select
          value={toUid}
          onChange={(e) => setToUid(e.target.value)}
          className="p-2 border border-gray-300 rounded w-full mt-1"
          required
        >
          <option value="">Select colleague</option>
          {employees.map((e) => (
            <option key={e.uid} value={e.uid}>
              {e.fullName || e.email}
            </option>
          ))}
        </select>
        {toUid && selectedEmployee && (
          <div className="flex items-center gap-2 mt-2">
            <UserAvatar
              nameOrEmail={selectedEmployee.fullName || selectedEmployee.email}
              photoURL={
                typeof selectedEmployee.photoURL === "string"
                  ? selectedEmployee.photoURL
                  : undefined
              }
              size={32}
            />
            <span className="text-sm">
              {selectedEmployee.fullName || selectedEmployee.email}
            </span>
          </div>
        )}
      </label>

      {/* Message */}
      <label className="font-medium">
        Message
        <textarea
          placeholder="Message"
          value={message}
          className="p-2 border border-gray-300 rounded w-full mt-1"
          onChange={(e) => setMessage(e.target.value)}
          rows={2}
          required
        />
      </label>

      <button
        type="submit"
        className="bg-green-600 text-white rounded px-4 py-2 hover:bg-green-700 transition"
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Kudos"}
      </button>
      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">{success}</div>}
    </form>
  );
}
