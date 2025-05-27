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
    <div className="max-w-3xl mx-auto mt-12 mb-10 bg-white p-8 rounded-3xl shadow-2xl">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 flex items-center gap-2">
        🎁 Company Rewards Catalog
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col md:flex-row gap-6 mb-8" aria-label={editId ? "Edit Reward" : "Add Reward"}>
        <div className="flex-1 flex flex-col gap-2">
          <input
            type="text"
            name="name"
            placeholder="Reward Name (e.g. $10 Gift Card)"
            className="p-3 border rounded-lg"
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
            className="p-3 border rounded-lg"
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
            className="p-3 border rounded-lg"
            value={form.imageUrl || ""}
            onChange={handleFormChange}
            maxLength={300}
            disabled={saving}
            aria-label="Image URL"
          />
        </div>
        <div className="flex flex-col gap-2 md:w-52">
          <input
            type="number"
            name="pointsCost"
            min={1}
            placeholder="Points"
            className="p-3 border rounded-lg"
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
            className="p-3 border rounded-lg"
            value={form.quantity === undefined || form.quantity === null ? "" : form.quantity}
            onChange={handleFormChange}
            disabled={saving}
            aria-label="Reward Quantity"
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 mt-2 transition disabled:opacity-60"
            disabled={saving}
            aria-disabled={saving}
          >
            {saving ? "Saving..." : editId ? "Update Reward" : "Add Reward"}
          </button>
          {editId && (
            <button
              type="button"
              className="border border-gray-300 text-gray-700 rounded-lg px-4 py-2 font-semibold hover:bg-gray-200 transition mt-1"
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

      <h2 className="text-xl font-semibold mb-3 mt-6">All Rewards</h2>
      {loading ? (
        <div className="text-gray-600">Loading rewards...</div>
      ) : rewards.length === 0 ? (
        <div className="text-gray-400 italic">No rewards created yet.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm" aria-label="Company Rewards Table">
            <thead>
              <tr className="bg-gray-100">
                <th className="py-2 px-3">Reward</th>
                <th className="py-2 px-3">Cost</th>
                <th className="py-2 px-3">Qty</th>
                <th className="py-2 px-3"></th>
              </tr>
            </thead>
            <tbody>
              {rewards.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-2 px-3 font-semibold flex items-center gap-2 min-w-[140px]">
                    {r.imageUrl && (
                      <img src={r.imageUrl} alt="" className="w-9 h-9 rounded object-cover border" />
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
                  <td className="py-2 px-3 flex gap-2 min-w-[100px]">
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
        </div>
      )}
    </div>
  );
}
