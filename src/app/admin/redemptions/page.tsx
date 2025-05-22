"use client";
import React, { useEffect, useState } from "react";
import { db } from "../../../lib/firebase";
import { useAuth } from "../../../context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  increment,
  addDoc,
} from "firebase/firestore";
import Toast from "../../../components/Toast";

type Redemption = {
  id: string;
  rewardId: string;
  rewardName: string;
  userId: string;
  userEmail: string;
  status: "pending" | "approved" | "fulfilled" | "denied";
  requestedAt: any;
  fulfilledAt?: any;
  notes?: string;
  pointsCost: number;
  companyId: string;
};

export default function AdminRedemptionsPage() {
  const { companyId, role } = useAuth();

  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [noteEdit, setNoteEdit] = useState<{ [id: string]: string }>({});

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    getDocs(
      query(
        collection(db, "redemptions"),
        where("companyId", "==", companyId),
        orderBy("requestedAt", "desc")
      )
    ).then((snap) => {
      setRedemptions(
        snap.docs.map((d) => ({
          ...(d.data() as Omit<Redemption, "id">),
          id: d.id,
        }))
      );
      setLoading(false);
    });
  }, [companyId, success, processingId]);

  if (role !== "admin") {
    return (
      <div className="text-red-500 font-bold mt-16 text-center">
        Admin Only – You do not have access to this page.
      </div>
    );
  }

  // Filtering
  const filtered = statusFilter === "all"
    ? redemptions
    : redemptions.filter((r) => r.status === statusFilter);

  // --- Only deduct points ON FULFILL ---
  async function markFulfilled(id: string) {
    setProcessingId(id);
    setError(null);
    setSuccess(null);
    try {
      const redemption = redemptions.find(r => r.id === id);
      if (!redemption) throw new Error("Redemption not found.");
      // 1. Deduct points if not already deducted (fulfilled)
      // Find user doc
      const usersSnap = await getDocs(
        query(
          collection(db, "users"),
          where("companyId", "==", companyId),
          where("uid", "==", redemption.userId)
        )
      );
      if (!usersSnap.empty) {
        const userDocRef = doc(db, "users", usersSnap.docs[0].id);
        // Reduce points (never negative)
        await updateDoc(userDocRef, {
          points: increment(-Math.abs(redemption.pointsCost)),
        });
      }
      // 2. Update redemption
      await updateDoc(doc(db, "redemptions", id), {
        status: "fulfilled",
        fulfilledAt: new Date(),
        notes: noteEdit[id] || "",
      });
      // 3. Send notification
      await addDoc(collection(db, "notifications"), {
        toUid: redemption.userId,
        toEmail: redemption.userEmail,
        companyId: redemption.companyId,
        type: "redemption",
        rewardName: redemption.rewardName,
        pointsCost: redemption.pointsCost,
        status: "fulfilled",
        message: `Your reward "${redemption.rewardName}" has been fulfilled and ${redemption.pointsCost} points were deducted.`,
        sentAt: new Date(),
        read: false,
      });
      setSuccess("Marked as fulfilled and points deducted!");
    } catch (err: any) {
      setError(err.message || "Could not mark as fulfilled.");
    }
    setProcessingId(null);
  }

  // --- Refund points if denied ---
  async function markDenied(redemption: Redemption) {
    setProcessingId(redemption.id);
    setError(null);
    setSuccess(null);
    try {
      await updateDoc(doc(db, "redemptions", redemption.id), {
        status: "denied",
        notes: noteEdit[redemption.id] || "",
      });
      // Refund points to the user
      const usersSnap = await getDocs(
        query(
          collection(db, "users"),
          where("companyId", "==", companyId),
          where("uid", "==", redemption.userId)
        )
      );
      if (!usersSnap.empty) {
        const userDocRef = doc(db, "users", usersSnap.docs[0].id);
        await updateDoc(userDocRef, {
          points: increment(redemption.pointsCost),
        });
      }
      // Notify user
      await addDoc(collection(db, "notifications"), {
        toUid: redemption.userId,
        toEmail: redemption.userEmail,
        companyId: redemption.companyId,
        type: "redemption",
        rewardName: redemption.rewardName,
        pointsCost: redemption.pointsCost,
        status: "denied",
        message: `Your reward redemption for "${redemption.rewardName}" was denied and your points have been refunded.`,
        sentAt: new Date(),
        read: false,
      });
      setSuccess("Marked as denied and refunded points.");
    } catch (err: any) {
      setError(err.message || "Could not mark as denied.");
    }
    setProcessingId(null);
  }

  // --- Approve (optional step) ---
  async function markApproved(id: string) {
    setProcessingId(id);
    setError(null);
    setSuccess(null);
    try {
      const redemption = redemptions.find(r => r.id === id);
      await updateDoc(doc(db, "redemptions", id), {
        status: "approved",
        notes: noteEdit[id] || "",
      });
      // Notify user
      if (redemption) {
        await addDoc(collection(db, "notifications"), {
          toUid: redemption.userId,
          toEmail: redemption.userEmail,
          companyId: redemption.companyId,
          type: "redemption",
          rewardName: redemption.rewardName,
          pointsCost: redemption.pointsCost,
          status: "approved",
          message: `Your reward redemption for "${redemption.rewardName}" has been approved!`,
          sentAt: new Date(),
          read: false,
        });
      }
      setSuccess("Marked as approved!");
    } catch (err: any) {
      setError(err.message || "Could not mark as approved.");
    }
    setProcessingId(null);
  }

  // Save admin note for a redemption
  function handleNoteChange(id: string, val: string) {
    setNoteEdit((prev) => ({ ...prev, [id]: val }));
  }

  return (
    <div className="max-w-4xl mx-auto mt-12 mb-10 bg-white p-8 rounded-3xl shadow-2xl">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 flex items-center gap-2">
        🎟️ Redemption Requests
      </h1>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-lg font-semibold text-blue-800">
          Review and process all reward redemptions.
        </div>
        <div>
          <select
            className="border rounded p-2 text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="fulfilled">Fulfilled</option>
            <option value="denied">Denied</option>
            <option value="all">All</option>
          </select>
        </div>
      </div>
      {error && (
        <Toast message={error} type="error" onClose={() => setError(null)} />
      )}
      {success && (
        <Toast message={success} type="success" onClose={() => setSuccess(null)} />
      )}
      {loading ? (
        <div className="text-gray-600">Loading redemptions...</div>
      ) : filtered.length === 0 ? (
        <div className="text-gray-400 italic">No redemption requests found.</div>
      ) : (
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3">User</th>
              <th className="py-2 px-3">Reward</th>
              <th className="py-2 px-3">Points</th>
              <th className="py-2 px-3">Requested</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Note</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2 px-3">
                  <div className="font-semibold">{r.userEmail}</div>
                  <div className="text-xs text-gray-400">{r.userId}</div>
                </td>
                <td className="py-2 px-3 font-bold">{r.rewardName}</td>
                <td className="py-2 px-3">{r.pointsCost}</td>
                <td className="py-2 px-3">
                  {r.requestedAt && r.requestedAt.toDate
                    ? r.requestedAt.toDate().toLocaleDateString()
                    : ""}
                </td>
                <td className="py-2 px-3 font-semibold">
                  {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                </td>
                <td className="py-2 px-3">
                  <textarea
                    className="w-32 p-1 border rounded text-xs"
                    value={noteEdit[r.id] ?? r.notes ?? ""}
                    onChange={(e) => handleNoteChange(r.id, e.target.value)}
                    placeholder="Add note..."
                    rows={2}
                  />
                </td>
                <td className="py-2 px-3 flex gap-2 flex-col min-w-[140px]">
                  {r.status === "pending" && (
                    <>
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700 transition"
                        disabled={processingId === r.id}
                        onClick={() => markFulfilled(r.id)}
                      >
                        {processingId === r.id ? "Processing..." : "Mark Fulfilled"}
                      </button>
                      <button
                        className="bg-red-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-red-600 transition"
                        disabled={processingId === r.id}
                        onClick={() => markDenied(r)}
                      >
                        Deny + Refund
                      </button>
                      <button
                        className="bg-blue-500 text-white px-3 py-1 rounded text-xs font-bold hover:bg-blue-600 transition"
                        disabled={processingId === r.id}
                        onClick={() => markApproved(r.id)}
                      >
                        Approve (optional)
                      </button>
                    </>
                  )}
                  {r.status === "approved" && (
                    <button
                      className="bg-green-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-green-700 transition"
                      disabled={processingId === r.id}
                      onClick={() => markFulfilled(r.id)}
                    >
                      Mark Fulfilled
                    </button>
                  )}
                  {r.status === "fulfilled" && (
                    <span className="text-green-600 text-xs font-bold">Fulfilled</span>
                  )}
                  {r.status === "denied" && (
                    <span className="text-red-600 text-xs font-bold">Denied</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
