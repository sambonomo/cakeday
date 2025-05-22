"use client";
import React, { useEffect, useState } from "react";
import { db } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  orderBy,
  serverTimestamp,
  deleteDoc,
  doc,
} from "firebase/firestore";
import Toast from "../../components/Toast";

type Reward = {
  id: string;
  name: string;
  description?: string;
  pointsCost: number;
  imageUrl?: string;
  quantity?: number | null; // null/undefined = unlimited
  companyId: string;
};

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
};

export default function RewardsPage() {
  const { user, companyId } = useAuth();

  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<number>(0);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [notes, setNotes] = useState<{ [rewardId: string]: string }>({}); // notes per reward

  // Fetch all available rewards
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
  }, [companyId, success]);

  // Fetch user points and redemption history
  useEffect(() => {
    if (!companyId || !user) return;
    setLoading(true);
    getDocs(
      query(
        collection(db, "users"),
        where("companyId", "==", companyId),
        where("uid", "==", user.uid)
      )
    ).then((snap) => {
      if (!snap.empty) {
        const u = snap.docs[0].data() as any;
        setPoints(Number(u.points || 0));
      }
      setLoading(false);
    });
    // Fetch redemption requests
    getDocs(
      query(
        collection(db, "redemptions"),
        where("companyId", "==", companyId),
        where("userId", "==", user.uid),
        orderBy("requestedAt", "desc")
      )
    ).then((snap) => {
      setRedemptions(
        snap.docs.map((d) => ({
          ...(d.data() as Omit<Redemption, "id">),
          id: d.id,
        }))
      );
    });
  }, [companyId, user, success]);

  // Handle redeem action
  async function handleRedeem(reward: Reward) {
    if (!user || !companyId) return;
    setError(null);
    setSuccess(null);
    setRedeemingId(reward.id);

    // Block if already pending or approved for this reward
    const existing = redemptions.find(
      (r) =>
        r.rewardId === reward.id &&
        (r.status === "pending" || r.status === "approved")
    );
    if (existing) {
      setError("You already have a pending or approved request for this reward.");
      setRedeemingId(null);
      return;
    }

    // Double-check points and quantity
    if (points < reward.pointsCost) {
      setError("You do not have enough points.");
      setRedeemingId(null);
      return;
    }
    if (
      reward.quantity !== undefined &&
      reward.quantity !== null &&
      reward.quantity < 1
    ) {
      setError("This reward is out of stock.");
      setRedeemingId(null);
      return;
    }

    try {
      // Record the redemption request
      await addDoc(collection(db, "redemptions"), {
        rewardId: reward.id,
        rewardName: reward.name,
        userId: user.uid,
        userEmail: user.email,
        companyId,
        status: "pending",
        requestedAt: serverTimestamp(),
        pointsCost: reward.pointsCost,
        notes: notes[reward.id]?.trim() || "",
      });
      setSuccess("Redemption request sent! You will be contacted by an admin.");
      setNotes((n) => ({ ...n, [reward.id]: "" })); // Clear notes field for that reward
    } catch (err: any) {
      setError(err.message || "Could not request reward.");
    }
    setRedeemingId(null);
  }

  // Allow user to cancel their pending redemption
  async function handleCancelRedemption(redemption: Redemption) {
    if (!window.confirm("Are you sure you want to cancel this pending redemption?")) return;
    try {
      await deleteDoc(doc(db, "redemptions", redemption.id));
      setSuccess("Redemption cancelled.");
    } catch (err: any) {
      setError(err.message || "Could not cancel redemption.");
    }
  }

  if (!user || !companyId)
    return <div className="text-gray-500 mt-12">Please log in.</div>;

  return (
    <div className="max-w-3xl mx-auto mt-12 mb-10 bg-white p-8 rounded-3xl shadow-2xl">
      <h1 className="text-3xl font-bold text-blue-700 mb-6 flex items-center gap-2">
        🎁 Rewards Store
      </h1>
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="text-lg font-semibold text-blue-800">
          Your Points: <span className="font-bold">{points}</span>
        </div>
        <div className="text-sm text-gray-500">
          Use your points to redeem any available reward!
        </div>
      </div>
      {error && (
        <Toast message={error} type="error" onClose={() => setError(null)} />
      )}
      {success && (
        <Toast message={success} type="success" onClose={() => setSuccess(null)} />
      )}
      <h2 className="text-xl font-semibold mb-3 mt-6">Available Rewards</h2>
      {loading ? (
        <div className="text-gray-600">Loading rewards...</div>
      ) : rewards.length === 0 ? (
        <div className="text-gray-400 italic">No rewards available yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
          {rewards.map((r) => {
            const outOfStock =
              r.quantity !== undefined && r.quantity !== null && r.quantity < 1;
            const notEnoughPoints = points < r.pointsCost;
            // Block if user has a pending/approved redemption for this reward
            const alreadyRequested = redemptions.some(
              (red) =>
                red.rewardId === r.id &&
                (red.status === "pending" || red.status === "approved")
            );
            return (
              <div
                key={r.id}
                className={`rounded-xl border-2 p-5 bg-blue-50 flex flex-col gap-2 shadow relative ${
                  outOfStock ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  {r.imageUrl && (
                    <img
                      src={r.imageUrl}
                      alt=""
                      className="w-16 h-16 object-cover rounded border"
                    />
                  )}
                  <div>
                    <div className="font-bold text-lg text-blue-900">{r.name}</div>
                    <div className="text-blue-700 font-bold text-base">
                      {r.pointsCost} pts
                    </div>
                  </div>
                </div>
                {r.description && (
                  <div className="text-xs text-gray-500 mt-1">{r.description}</div>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <div className="text-xs text-gray-600">
                    {r.quantity === undefined || r.quantity === null
                      ? "Unlimited"
                      : r.quantity < 1
                      ? "Out of stock"
                      : `Available: ${r.quantity}`}
                  </div>
                </div>
                {/* Optional notes input */}
                <input
                  type="text"
                  placeholder="Notes (optional)"
                  className="p-2 mt-2 border border-gray-200 rounded w-full text-sm"
                  value={notes[r.id] || ""}
                  onChange={e =>
                    setNotes((prev) => ({
                      ...prev,
                      [r.id]: e.target.value,
                    }))
                  }
                  maxLength={120}
                  disabled={outOfStock || notEnoughPoints || alreadyRequested}
                />
                <button
                  disabled={
                    notEnoughPoints ||
                    outOfStock ||
                    !!redeemingId ||
                    alreadyRequested
                  }
                  onClick={() => handleRedeem(r)}
                  className={`mt-2 px-4 py-2 rounded-xl font-bold text-white shadow transition
                    ${
                      notEnoughPoints || outOfStock || !!redeemingId || alreadyRequested
                        ? "bg-gray-300 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                >
                  {alreadyRequested
                    ? "Request Pending"
                    : outOfStock
                    ? "Out of Stock"
                    : notEnoughPoints
                    ? "Not Enough Points"
                    : redeemingId === r.id
                    ? "Processing..."
                    : "Redeem"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      <h2 className="text-xl font-semibold mb-3 mt-8">Your Redemption History</h2>
      {redemptions.length === 0 ? (
        <div className="text-gray-400 italic">No redemption requests yet.</div>
      ) : (
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-3">Reward</th>
              <th className="py-2 px-3">Points</th>
              <th className="py-2 px-3">Requested</th>
              <th className="py-2 px-3">Status</th>
              <th className="py-2 px-3">Notes</th>
              <th className="py-2 px-3"></th>
            </tr>
          </thead>
          <tbody>
            {redemptions.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-2 px-3">{r.rewardName}</td>
                <td className="py-2 px-3">{r.pointsCost}</td>
                <td className="py-2 px-3">
                  {r.requestedAt && r.requestedAt.toDate
                    ? r.requestedAt.toDate().toLocaleDateString()
                    : ""}
                </td>
                <td className="py-2 px-3 font-semibold">
                  {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                  {r.status === "denied" && (
                    <span className="text-red-500 ml-1">❌</span>
                  )}
                  {r.status === "fulfilled" && (
                    <span className="text-green-600 ml-1">✔️</span>
                  )}
                </td>
                <td className="py-2 px-3">{r.notes || ""}</td>
                <td className="py-2 px-3">
                  {r.status === "pending" && (
                    <button
                      className="text-xs text-red-600 underline"
                      onClick={() => handleCancelRedemption(r)}
                    >
                      Cancel
                    </button>
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
