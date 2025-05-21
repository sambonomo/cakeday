"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import { db } from "../../../lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { nanoid } from "nanoid";
import Toast from "../../../components/Toast";

type Company = {
  id: string;
  name: string;
  domain: string;
  inviteCode: string;
  createdAt?: any;
  inviteCodeUpdatedAt?: any;
};

export default function CompanySettingsPage() {
  const { companyId, role } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDomain, setEditDomain] = useState("");
  const [copied, setCopied] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    async function loadCompany() {
      if (!companyId) return;
      setLoading(true);
      const snap = await getDoc(doc(db, "companies", companyId));
      if (snap.exists()) {
        const data = snap.data();
        setCompany({
          id: companyId,
          name: data.name,
          domain: data.domain,
          inviteCode: data.inviteCode,
          createdAt: data.createdAt,
          inviteCodeUpdatedAt: data.inviteCodeUpdatedAt,
        });
        setEditName(data.name);
        setEditDomain(data.domain);
      }
      setLoading(false);
    }
    loadCompany();
  }, [companyId]);

  if (role !== "admin") {
    return <div className="text-red-500 font-bold mt-16 text-center">Admins only</div>;
  }
  if (loading || !company) {
    return <div className="text-gray-500 mt-12">Loading company settings...</div>;
  }

  // Save company name/domain
  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!company) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "companies", company.id), {
        name: editName,
        domain: editDomain,
      });
      setCompany({
        ...company,
        id: company.id, // always present, never undefined
        name: editName,
        domain: editDomain,
      });
      setToast("Company info updated!");
    } catch (err: any) {
      setToast("Failed to update company info: " + (err.message || "Error"));
    }
    setSaving(false);
  }

  // Regenerate invite code
  async function handleRegenerateCode() {
    if (!company) return;
    setSaving(true);
    try {
      const newCode = nanoid(8).toUpperCase();
      const updatedAt = new Date();
      await updateDoc(doc(db, "companies", company.id), {
        inviteCode: newCode,
        inviteCodeUpdatedAt: updatedAt,
      });
      setCompany({
        ...company,
        id: company.id,
        inviteCode: newCode,
        inviteCodeUpdatedAt: updatedAt,
      });
      setToast("Invite code regenerated!");
    } catch (err: any) {
      setToast("Failed to update invite code: " + (err.message || "Error"));
    }
    setSaving(false);
  }

  // Copy invite code to clipboard
  function handleCopy() {
    if (!company?.inviteCode) return;
    navigator.clipboard.writeText(company.inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  return (
    <div className="max-w-xl mx-auto mt-12 mb-10 bg-white p-8 rounded-3xl shadow-2xl">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 flex items-center gap-2">
        🏢 Company Settings
      </h1>
      <form onSubmit={handleSave} className="flex flex-col gap-5 mb-8">
        <label className="font-semibold">
          Company Name
          <input
            type="text"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            className="p-3 border rounded-lg w-full mt-1"
            maxLength={60}
            required
          />
        </label>
        <label className="font-semibold">
          Company Domain
          <input
            type="text"
            value={editDomain}
            onChange={e => setEditDomain(e.target.value)}
            className="p-3 border rounded-lg w-full mt-1"
            maxLength={80}
            required
          />
        </label>
        <button
          type="submit"
          className="bg-blue-600 text-white rounded-lg px-5 py-2 font-bold hover:bg-blue-700 mt-1"
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
      <hr className="mb-6 border-blue-100" />

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mb-2">
        <span className="font-semibold text-yellow-700">
          Company Invite Code:
        </span>
        <span className="font-mono bg-yellow-100 rounded px-2 py-1 text-yellow-900 text-lg tracking-widest">
          {company.inviteCode}
        </span>
        <button
          className="px-4 py-2 rounded bg-yellow-400 text-white font-semibold hover:bg-yellow-500 transition"
          onClick={handleCopy}
          title="Copy code to clipboard"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-3">
        <button
          className="bg-pink-600 text-white px-4 py-2 rounded font-bold hover:bg-pink-700 transition"
          onClick={handleRegenerateCode}
          disabled={saving}
        >
          {saving ? "Regenerating..." : "Regenerate Code"}
        </button>
        {company.inviteCodeUpdatedAt && (
          <span className="text-xs text-gray-400">
            Last updated: {company.inviteCodeUpdatedAt.toDate
              ? company.inviteCodeUpdatedAt.toDate().toLocaleDateString()
              : ""}
          </span>
        )}
      </div>
      {toast && (
        <Toast
          message={toast}
          type="success"
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
