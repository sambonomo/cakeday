"use client";

import React, { useEffect, useState, useRef } from "react";
import { db } from "../lib/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { getOnboardingTemplates, assignTemplateToNewHire } from "../lib/firestoreOnboarding";
import Toast from "./Toast";

type ModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (email: string) => void;
};

type Template = {
  id: string;
  name: string;
  department?: string;
  role?: string;
};

type UserProfile = {
  uid: string;
  fullName?: string;
  email: string;
  role?: string;
  department?: string;
};

export default function InviteNewHireModal({ open, onClose, onSuccess }: ModalProps) {
  const { companyId } = useAuth();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [managerId, setManagerId] = useState("");
  const [templates, setTemplates] = useState<Template[]>([]);
  const [managers, setManagers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const firstInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch templates & managers on open
  useEffect(() => {
    if (!open || !companyId) return;
    getOnboardingTemplates(companyId).then(setTemplates);
    getDocs(
      query(
        collection(db, "users"),
        where("companyId", "==", companyId),
        where("role", "in", ["manager", "admin"])
      )
    )
      .then((snap) =>
        setManagers(
          snap.docs.map((d) => ({
            uid: d.id,
            ...(d.data() as Omit<UserProfile, "uid">),
          }))
        )
      )
      .catch(() => setManagers([]));
    // Autofocus first input
    setTimeout(() => firstInputRef.current?.focus(), 100);
  }, [open, companyId]);

  // Reset fields on open/close
  useEffect(() => {
    if (open) {
      setEmail("");
      setFullName("");
      setTemplateId("");
      setStartDate("");
      setManagerId("");
      setToast(null);
    }
  }, [open]);

  // Keyboard close (ESC)
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  // --- Enhanced Invite Handler ---
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setToast(null);

    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedEmail || !templateId || !startDate) {
      setToast("All fields except Manager/Name are required.");
      return;
    }
    setLoading(true);

    try {
      // Check if user already exists by email
      const existing = await getDocs(
        query(
          collection(db, "users"),
          where("companyId", "==", companyId),
          where("email", "==", trimmedEmail)
        )
      );
      if (!existing.empty) {
        setToast("A user with this email already exists.");
        setLoading(false);
        return;
      }

      // Create a disabled user profile (invited, not active)
      const userRef = await addDoc(collection(db, "users"), {
        email: trimmedEmail,
        fullName: fullName.trim(),
        companyId,
        role: "user",
        department: "",
        status: "invited", // Use 'invited' to track until activation
        onboardingTemplateId: templateId,
        hireStartDate: startDate,
        managerId: managerId || null,
        disabled: true, // User must activate via invite link
        createdAt: serverTimestamp(),
      });

      // Assign onboarding tasks instantly (new hire onboarding)
      await assignTemplateToNewHire(
        userRef.id,
        templateId,
        companyId!,
        new Date(startDate)
      );

      // --- 🔥 TO-DO: Send an activation/invite email via Firebase Function or external API
      // await sendActivationEmail(trimmedEmail, ...);
      // Example: Use Firebase Function with a custom "inviteUser" endpoint

      setToast("Invite sent & onboarding checklist assigned!");
      onSuccess?.(trimmedEmail);
      setTimeout(() => {
        setLoading(false);
        onClose();
      }, 1200);
    } catch (err: any) {
      setToast(err.message || "Error sending invite.");
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      tabIndex={-1}
    >
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md relative animate-fade-in-up">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl"
          onClick={onClose}
          aria-label="Close modal"
        >
          &times;
        </button>
        <h2 className="text-2xl font-bold text-blue-700 mb-5 flex items-center gap-2">
          <span>🎉</span> Invite New Hire
        </h2>
        <form className="flex flex-col gap-4" onSubmit={handleInvite} autoComplete="off">
          <input
            ref={firstInputRef}
            type="email"
            placeholder="Work Email"
            className="p-3 border rounded-lg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
            maxLength={80}
            spellCheck={false}
          />
          <input
            type="text"
            placeholder="Full Name (optional)"
            className="p-3 border rounded-lg"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            maxLength={60}
            spellCheck={false}
          />
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            className="p-3 border rounded-lg"
            required
          >
            <option value="">-- Select Onboarding Template --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
                {t.department ? ` (${t.department})` : ""}
                {t.role ? ` (${t.role})` : ""}
              </option>
            ))}
          </select>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="p-3 border rounded-lg"
            required
            min={new Date().toISOString().split("T")[0]}
          />
          <select
            value={managerId}
            onChange={(e) => setManagerId(e.target.value)}
            className="p-3 border rounded-lg"
          >
            <option value="">-- Optional: Assign Manager --</option>
            {managers.map((m) => (
              <option key={m.uid} value={m.uid}>
                {m.fullName || m.email} ({m.role})
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-xl px-4 py-3 font-bold shadow hover:bg-blue-700 transition disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Invite"}
          </button>
          {/* Placeholder for next-step: Resend Invite */}
          {/* <button type="button" ...>Resend Activation Email</button> */}
        </form>
        {toast && (
          <Toast message={toast} type="success" onClose={() => setToast(null)} />
        )}
        <div className="mt-4 text-xs text-gray-400">
          New hires are invited as <b>inactive users</b>. They’ll receive an onboarding checklist after activation.
        </div>
      </div>
    </div>
  );
}
