"use client";

import React, { useState, useEffect } from "react";
import { giveKudos } from "../lib/firestoreRecognition";
import { useAuth } from "../context/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { UserProfile } from "../lib/firestoreUsers";

// List of preset badges/emojis
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

export default function GiveKudosForm({ companyId: propCompanyId }: GiveKudosFormProps): React.ReactElement {
  const { user, companyId: contextCompanyId } = useAuth();
  const companyId = propCompanyId || contextCompanyId;

  const [employees, setEmployees] = useState<UserProfile[]>([]);
  const [toUid, setToUid] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [badge, setBadge] = useState<string>(BADGES[0].emoji); // Default to first emoji
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Fetch all employees (users collection in this company)
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
      setEmployees(list.filter((e) => e.uid !== user?.uid)); // Exclude self
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

    try {
      await giveKudos({
        fromUid: user.uid,
        fromEmail: user.email!,
        toUid: recipient.uid,
        toEmail: recipient.email,
        message: message.trim(),
        badge,
        companyId, // Pass companyId for isolation!
      });
      setSuccess("Kudos sent!");
      setToUid("");
      setMessage("");
      setBadge(BADGES[0].emoji); // Reset badge to default
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Error sending kudos.");
      } else {
        setError("Error sending kudos.");
      }
    }
    setLoading(false);
  };

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
      <select
        value={toUid}
        onChange={(e) => setToUid(e.target.value)}
        className="p-2 border border-gray-300 rounded"
        required
      >
        <option value="">Select colleague</option>
        {employees.map((e) => (
          <option key={e.uid} value={e.uid}>
            {e.email}
          </option>
        ))}
      </select>

      {/* Message */}
      <textarea
        placeholder="Message"
        value={message}
        className="p-2 border border-gray-300 rounded"
        onChange={(e) => setMessage(e.target.value)}
        rows={2}
        required
      />

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
