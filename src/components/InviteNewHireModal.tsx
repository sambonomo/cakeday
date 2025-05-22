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
import { UserPlus, Sparkles } from "lucide-react";

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
        status: "invited",
        onboardingTemplateId: templateId,
        hireStartDate: startDate,
        managerId: managerId || null,
        disabled: true,
        createdAt: serverTimestamp(),
      });

      // Assign onboarding tasks instantly (new hire onboarding)
      await assignTemplateToNewHire(
        userRef.id,
        templateId,
        companyId!,
        new Date(startDate)
      );

      // --- TO-DO: Send activation email via Cloud Function

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md animate-fade-in"
      tabIndex={-1}
      aria-modal="true"
      role="dialog"
    >
      <div className="
        bg-white/95 rounded-3xl shadow-2xl p-8 w-full max-w-md relative animate-fade-in-up border border-blue-100
        transition-all duration-300
      ">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-red-600 text-2xl"
          onClick={onClose}
          aria-label="Close modal"
        >
          &times;
        </button>
        <div className="flex items-center gap-3 mb-2">
          <UserPlus className="w-8 h-8 text-blue-500" />
          <h2 className="text-2xl font-extrabold text-blue-800 flex items-center gap-2 tracking-tight">
            Invite New Hire
          </h2>
        </div>
        <form className="flex flex-col gap-4 mt-3" onSubmit={handleInvite} autoComplete="off">
          {/* Email */}
          <div>
            <label className="block text-sm font-semibold text-blue-700 mb-1">Work Email <span className="text-red-500">*</span></label>
            <input
              ref={firstInputRef}
              type="email"
              placeholder="e.g. sam@yourco.com"
              className="p-3 border-2 border-blue-100 rounded-xl w-full focus:outline-none focus:border-blue-400 bg-blue-50 transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              maxLength={80}
              spellCheck={false}
            />
          </div>
          {/* Name */}
          <div>
            <label className="block text-sm font-semibold text-blue-700 mb-1">Full Name</label>
            <input
              type="text"
              placeholder="Full Name (optional)"
              className="p-3 border-2 border-gray-100 rounded-xl w-full focus:outline-none focus:border-blue-300 transition"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              maxLength={60}
              spellCheck={false}
            />
          </div>
          {/* Onboarding Template */}
          <div>
            <label className="block text-sm font-semibold text-blue-700 mb-1">Onboarding Template <span className="text-red-500">*</span></label>
            <select
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
              className="p-3 border-2 border-blue-100 rounded-xl w-full bg-blue-50 focus:outline-none focus:border-blue-400"
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
          </div>
          {/* Start Date */}
          <div>
            <label className="block text-sm font-semibold text-blue-700 mb-1">Start Date <span className="text-red-500">*</span></label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="p-3 border-2 border-blue-100 rounded-xl w-full bg-blue-50 focus:outline-none focus:border-blue-400"
              required
              min={new Date().toISOString().split("T")[0]}
            />
          </div>
          {/* Optional Manager */}
          <div>
            <label className="block text-sm font-semibold text-blue-700 mb-1">Assign Manager (optional)</label>
            <select
              value={managerId}
              onChange={(e) => setManagerId(e.target.value)}
              className="p-3 border-2 border-gray-100 rounded-xl w-full bg-gray-50 focus:outline-none focus:border-blue-300"
            >
              <option value="">-- No Manager --</option>
              {managers.map((m) => (
                <option key={m.uid} value={m.uid}>
                  {m.fullName || m.email} ({m.role})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            className="bg-gradient-to-r from-blue-600 via-blue-500 to-accent-500 text-white rounded-xl px-4 py-3 font-bold shadow hover:from-blue-700 hover:to-accent-700 transition-transform hover:scale-105 disabled:opacity-60"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Invite"}
          </button>
        </form>
        {/* Success/Error Toast */}
        {toast && (
          <Toast message={toast} type="success" onClose={() => setToast(null)} />
        )}
        <div className="mt-6 text-xs text-blue-400 text-center">
          New hires are invited as <b>inactive users</b>. They’ll get their onboarding checklist after activation.
        </div>
      </div>
    </div>
  );
}
