"use client";
import React, { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import Toast from "../../../components/Toast";

type Reward = {
  id: string;
  name: string;
  description?: string;
  pointsCost: number;
  imageUrl?: string;
  quantity?: number | null; // null/undefined = unlimited
  companyId: string;
};

export default function AdminRewardsPage() {
  const { companyId, role } = useAuth();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [form, setForm] = useState<Partial<Reward>>({
    name: "",
    description: "",
    pointsCost: 0,
    imageUrl: "",
    quantity: undefined,
  });
  const [editId, setEditId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    getDocs(
      query(
        collection(db, "rewards"),
        where("companyId", "==", companyId),
        orderBy("pointsCost", "asc")
      )
    ).then((snap) => {
      setRewards(
        snap.docs.map((d) => ({
          ...(d.data() as Omit<Reward, "id">),
          id: d.id,
        }))
      );
      setLoading(false);
    });
  }, [companyId, saving, success]);

  if (role !== "admin") {
    return (
      <div className="text-red-500 font-bold mt-16 text-center">
        Admin Only – You do not have access to this page.
      </div>
    );
  }

  function handleFormChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "pointsCost"
          ? value === "" ? 0 : Number(value)
          : name === "quantity"
          ? value === "" ? undefined : Number(value)
          : value,
    }));
  }

  function startEdit(r: Reward) {
    setEditId(r.id);
    setForm({
      name: r.name,
      description: r.description,
      pointsCost: r.pointsCost,
      imageUrl: r.imageUrl,
      quantity: r.quantity,
    });
    setError(null);
    setSuccess(null);
  }

  function cancelEdit() {
    setEditId(null);
    setForm({
      name: "",
      description: "",
      pointsCost: 0,
      imageUrl: "",
      quantity: undefined,
    });
    setError(null);
    setSuccess(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    // Basic validation
    if (
      !form.name ||
      !companyId ||
      typeof form.pointsCost !== "number" ||
      form.pointsCost <= 0
    ) {
      setError("Name and point cost (must be > 0) are required.");
      setSaving(false);
      return;
    }

    try {
      if (editId) {
        await updateDoc(doc(db, "rewards", editId), {
          ...form,
          companyId,
        });
        setSuccess("Reward updated!");
      } else {
        await addDoc(collection(db, "rewards"), {
          ...form,
          companyId,
        });
        setSuccess("Reward added!");
      }
      cancelEdit();
    } catch (err: any) {
      setError(err.message || "Error saving reward.");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Delete this reward?")) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await deleteDoc(doc(db, "rewards", id));
      setSuccess("Reward deleted.");
    } catch (err: any) {
      setError(err.message || "Delete failed.");
    }
    setSaving(false);
  }

  return (
    <div className="max-w-3xl mx-auto mt-12 mb-10 bg-white/90 border border-blue-100 rounded-2xl shadow-lg p-0 animate-fade-in">
      <div className="px-8 pt-8 pb-3 border-b border-blue-50 bg-gradient-to-r from-blue-50 via-white to-blue-100 rounded-t-2xl">
        <h1 className="text-2xl font-bold text-blue-700 flex items-center gap-2 mb-1">
          🎁 Company Rewards Catalog
        </h1>
        <div className="text-sm text-blue-500 mb-2">
          Add, update, and remove available rewards for your team.
        </div>
      </div>

      {/* Add/Edit form */}
      <form
        onSubmit={handleSubmit}
        className="flex flex-col md:flex-row gap-6 p-8 pb-4"
        aria-label={editId ? "Edit Reward" : "Add Reward"}
      >
        <div className="flex-1 flex flex-col gap-2">
          <input
            type="text"
            name="name"
            placeholder="Reward Name (e.g. $10 Gift Card)"
            className="p-2 border border-gray-200 rounded"
            value={form.name || ""}
            onChange={handleFormChange}
            required
            maxLength={60}
            disabled={saving}
            aria-label="Reward Name"
          />
          <textarea
            name="description"
            placeholder="Description (optional)"
            className="p-2 border border-gray-200 rounded"
            value={form.description || ""}
            onChange={handleFormChange}
            maxLength={160}
            rows={2}
            disabled={saving}
            aria-label="Reward Description"
          />
          <input
            type="text"
            name="imageUrl"
            placeholder="Image URL (optional)"
            className="p-2 border border-gray-200 rounded"
            value={form.imageUrl || ""}
            onChange={handleFormChange}
            maxLength={300}
            disabled={saving}
            aria-label="Image URL"
          />
        </div>
        <div className="flex flex-col gap-2 md:w-48">
          <input
            type="number"
            name="pointsCost"
            min={1}
            placeholder="Points"
            className="p-2 border border-gray-200 rounded"
            value={form.pointsCost === undefined ? "" : form.pointsCost}
            onChange={handleFormChange}
            required
            disabled={saving}
            aria-label="Points Cost"
          />
          <input
            type="number"
            name="quantity"
            min={0}
            placeholder="Quantity (leave blank = unlimited)"
            className="p-2 border border-gray-200 rounded"
            value={form.quantity === undefined || form.quantity === null ? "" : form.quantity}
            onChange={handleFormChange}
            disabled={saving}
            aria-label="Reward Quantity"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white rounded-lg px-4 py-2 font-bold shadow hover:bg-blue-700 transition disabled:opacity-60 mt-1"
            disabled={saving}
            aria-disabled={saving}
          >
            {saving ? "Saving..." : editId ? "Update Reward" : "Add Reward"}
          </button>
          {editId && (
            <button
              type="button"
              className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 font-semibold hover:bg-gray-100 transition mt-1"
              onClick={cancelEdit}
              aria-label="Cancel Edit"
              disabled={saving}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <Toast message={error} type="error" onClose={() => setError(null)} />}
      {success && <Toast message={success} type="success" onClose={() => setSuccess(null)} />}

      <div className="px-8 pb-3 pt-4 border-b border-blue-50 bg-blue-50/40">
        <h2 className="text-lg font-semibold mb-1">All Rewards</h2>
      </div>
      <div className="overflow-x-auto px-2 pb-6 pt-2">
        {loading ? (
          <div className="text-gray-600 px-2 py-8">Loading rewards...</div>
        ) : rewards.length === 0 ? (
          <div className="text-gray-400 italic px-2 py-6">No rewards created yet.</div>
        ) : (
          <table className="min-w-full text-sm bg-transparent" aria-label="Company Rewards Table">
            <thead>
              <tr className="bg-white border-b border-blue-50">
                <th className="py-2 px-3 text-left font-semibold text-blue-700">Reward</th>
                <th className="py-2 px-3 text-left font-semibold text-blue-700">Cost</th>
                <th className="py-2 px-3 text-left font-semibold text-blue-700">Qty</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((r) => (
                <tr key={r.id} className="border-b border-blue-50 last:border-b-0 hover:bg-blue-50/30 transition">
                  <td className="py-2 px-3 font-medium flex items-center gap-2 min-w-[140px]">
                    {r.imageUrl && (
                      <img src={r.imageUrl} alt="" className="w-8 h-8 rounded object-cover border" />
                    )}
                    <div>
                      <div>{r.name}</div>
                      {r.description && (
                        <div className="text-xs text-gray-500">{r.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-3 font-bold text-blue-700">{r.pointsCost}</td>
                  <td className="py-2 px-3">
                    {r.quantity === undefined || r.quantity === null || r.quantity === 0 ? (
                      <span className="text-gray-500">Unlimited</span>
                    ) : r.quantity}
                  </td>
                  <td className="py-2 px-3 flex gap-2 min-w-[90px]">
                    <button
                      className="text-blue-600 hover:underline text-xs"
                      onClick={() => startEdit(r)}
                      aria-label={`Edit ${r.name}`}
                      disabled={saving}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-500 hover:underline text-xs"
                      onClick={() => handleDelete(r.id)}
                      aria-label={`Delete ${r.name}`}
                      disabled={saving}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
