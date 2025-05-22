"use client";

import React, { useState, useEffect, useRef } from "react";
import { Combobox } from "@headlessui/react";
import { giveKudos } from "../lib/firestoreRecognition";
import { useAuth } from "../context/AuthContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import type { UserProfile } from "../lib/firestoreUsers";
import UserAvatar from "./UserAvatar";
import Toast from "./Toast";
import { Sparkles } from "lucide-react";

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
  const [queryValue, setQueryValue] = useState<string>("");
  const [toUid, setToUid] = useState<string | null>(null);
  const [message, setMessage] = useState<string>("");
  const [badge, setBadge] = useState<string>(BADGES[0].emoji);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [showToast, setShowToast] = useState<boolean>(false);

  const toastTimer = useRef<NodeJS.Timeout | null>(null);

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

  const filteredEmployees = queryValue
    ? employees.filter((e) =>
        (e.fullName || e.email)
          .toLowerCase()
          .includes(queryValue.toLowerCase())
      )
    : employees;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSuccess(null);
    setError(null);
    setShowToast(false);
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

    const fromName = user.fullName || user.email || "";
    const fromPhotoURL = user.photoURL || "";
    const toName = recipient.fullName || recipient.email;
    const toPhotoURL = typeof recipient.photoURL === "string" ? recipient.photoURL : undefined;

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
      setShowToast(true);
      setToUid(null);
      setQueryValue("");
      setMessage("");
      setBadge(BADGES[0].emoji);

      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setShowToast(false), 2500);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Error sending kudos.");
      } else {
        setError("Error sending kudos.");
      }
      setShowToast(true);
    }
    setLoading(false);
  };

  // --- Minor fix: TS-friendly, no need for ?? "" here
  const selectedEmployee = employees.find((e) => e.uid === toUid);

  return (
    <form
      onSubmit={handleSubmit}
      className="
        flex flex-col gap-6 mb-8 bg-white/90 rounded-2xl shadow-lg p-6
        border border-green-100 backdrop-blur-sm
        max-w-xl w-full
        animate-fade-in
      "
    >
      <h3 className="font-extrabold text-xl flex items-center gap-2 text-green-700 mb-1">
        <Sparkles className="w-6 h-6 text-yellow-400" />
        Give Kudos
      </h3>

      {/* Badge Picker */}
      <div>
        <label className="block font-medium mb-1">Badge</label>
        <div className="grid grid-cols-5 gap-2 mb-1">
          {BADGES.map((b) => (
            <button
              key={b.emoji}
              type="button"
              className={`flex flex-col items-center justify-center rounded-xl text-2xl px-0.5 py-2 border-2 cursor-pointer transition-all duration-150 focus:outline-none
                ${
                  badge === b.emoji
                    ? "bg-green-100 border-green-600 scale-105 shadow"
                    : "bg-gray-50 border-gray-200 hover:scale-105 hover:border-green-400"
                }`}
              aria-label={b.label}
              tabIndex={0}
              title={b.label}
              onClick={() => setBadge(b.emoji)}
            >
              <span>{b.emoji}</span>
              <span className="text-xs mt-1 text-gray-600">{b.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recipient Selection (Modern Combobox) */}
      <div>
        <label className="block font-medium mb-1">Recipient</label>
        <Combobox value={toUid} onChange={setToUid} nullable>
          <div className="relative">
            <Combobox.Input
              className="p-3 border-2 border-gray-200 rounded-xl w-full focus:outline-none focus:border-green-400 transition"
              displayValue={(uid: string | null) => {
                const e = employees.find((e) => e.uid === uid);
                return e ? e.fullName || e.email : "";
              }}
              placeholder="Search by name or email..."
              onChange={(e) => setQueryValue(e.target.value)}
              required
              autoComplete="off"
            />
            <Combobox.Options className="absolute z-10 mt-1 bg-white rounded-xl shadow-lg w-full border border-gray-100 max-h-56 overflow-auto animate-fade-in-up">
              {filteredEmployees.length === 0 && (
                <div className="text-gray-400 px-4 py-2">No matches found.</div>
              )}
              {filteredEmployees.map((e) => (
                <Combobox.Option
                  key={e.uid}
                  value={e.uid}
                  className={({ active }) =>
                    `flex items-center gap-3 px-4 py-2 cursor-pointer
                    ${active ? "bg-green-100 text-green-900" : ""}
                    `
                  }
                >
                  <UserAvatar
                    nameOrEmail={e.fullName || e.email}
                    photoURL={typeof e.photoURL === "string" ? e.photoURL : undefined}
                    size={28}
                  />
                  <span>{e.fullName || e.email}</span>
                  <span className="ml-2 text-xs text-gray-500">{e.email}</span>
                </Combobox.Option>
              ))}
            </Combobox.Options>
          </div>
        </Combobox>
        {/* Preview below for selected recipient */}
        {toUid && selectedEmployee && (
          <div className="flex items-center gap-2 mt-2">
            <UserAvatar
              nameOrEmail={selectedEmployee.fullName || selectedEmployee.email}
              photoURL={typeof selectedEmployee.photoURL === "string" ? selectedEmployee.photoURL : undefined}
              size={32}
            />
            <span className="text-sm font-medium">{selectedEmployee.fullName || selectedEmployee.email}</span>
            <span className="ml-2 text-xs text-gray-500">{selectedEmployee.email}</span>
          </div>
        )}
      </div>

      {/* Message */}
      <div>
        <label className="block font-medium mb-1">Message</label>
        <textarea
          placeholder="Say something awesome..."
          value={message}
          className="p-3 border-2 border-gray-200 rounded-xl w-full focus:outline-none focus:border-green-400 transition resize-none"
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          required
          maxLength={200}
        />
      </div>

      <button
        type="submit"
        className="bg-gradient-to-r from-green-600 via-green-500 to-green-700 text-white rounded-xl px-5 py-2 font-bold shadow-md hover:from-green-700 hover:to-green-800 transition-transform hover:scale-105 disabled:opacity-60"
        disabled={loading}
      >
        {loading ? "Sending..." : "Send Kudos"}
      </button>

      {/* Success/Error Toast */}
      {showToast && success && (
        <Toast
          message={success}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
      {showToast && error && (
        <Toast
          message={error}
          type="error"
          onClose={() => setShowToast(false)}
        />
      )}
    </form>
  );
}
