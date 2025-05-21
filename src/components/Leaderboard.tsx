"use client";

import { useEffect, useState } from "react";
import { fetchAllUsers, UserProfile } from "../lib/firestoreUsers";
import { useAuth } from "../context/AuthContext";
import { Crown, Star } from "lucide-react";

const BADGE_LABELS: Record<string, string> = {
  "first-kudos": "First Kudos 🎉",
  "50-points": "Level 1 ⭐",
  "100-points": "Level 2 🌟",
  // Add more badge milestones as needed
};

interface LeaderboardProps {
  companyId?: string;
  limit?: number; // Max users to show (default 10)
}

export default function Leaderboard({
  companyId: propCompanyId,
  limit = 10,
}: LeaderboardProps) {
  const { companyId: contextCompanyId } = useAuth();
  const companyId = propCompanyId || contextCompanyId;

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    fetchAllUsers(companyId).then((all) => {
      // Filter disabled users, sort by points desc, then name
      const ranked = all
        .filter((u) => !u.disabled)
        .sort((a, b) => (b.points || 0) - (a.points || 0) || (a.fullName || "").localeCompare(b.fullName || ""));
      setUsers(ranked.slice(0, limit));
      setLoading(false);
    });
  }, [companyId, limit]);

  if (loading) return <div className="text-gray-500">Loading leaderboard...</div>;
  if (users.length === 0) return <div className="text-gray-400">No kudos or points awarded yet.</div>;

  return (
    <div className="glass-card w-full max-w-2xl mx-auto shadow-xl rounded-3xl p-6 mt-8 animate-fade-in">
      <h2 className="text-2xl font-extrabold text-blue-700 flex items-center gap-2 mb-3">
        <Crown className="w-7 h-7 text-yellow-400 drop-shadow" /> Kudos Leaderboard
      </h2>
      <ul className="divide-y divide-blue-100">
        {users.map((u, idx) => (
          <li
            key={u.uid}
            className={`flex items-center gap-4 py-4 px-2 transition-all group ${
              idx === 0
                ? "bg-gradient-to-r from-yellow-50 via-blue-50 to-white rounded-xl border-2 border-yellow-300 shadow-lg"
                : ""
            }`}
          >
            {/* Position / Crown */}
            <span className="text-xl font-bold w-8 flex-shrink-0 text-center">
              {idx === 0 ? <Crown className="inline w-7 h-7 text-yellow-400" /> : idx + 1}
            </span>
            {/* Avatar */}
            <span className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center font-bold text-lg border-2 border-blue-300 shadow-sm select-none">
              {u.fullName
                ? u.fullName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : (u.email || "?")[0].toUpperCase()}
            </span>
            {/* User Info */}
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-blue-800 truncate">{u.fullName || u.email}</div>
              <div className="text-xs text-gray-400">{u.email}</div>
              {/* Badges */}
              <div className="flex gap-1 flex-wrap mt-1">
                {(u.badges || []).map((b) => (
                  <span
                    key={b}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200"
                    title={BADGE_LABELS[b] || b}
                  >
                    {BADGE_LABELS[b] || b}
                  </span>
                ))}
              </div>
            </div>
            {/* Points */}
            <div className="flex flex-col items-end justify-center min-w-[60px]">
              <span className="font-bold text-lg text-blue-900 flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400" /> {u.points || 0}
              </span>
              <span className="text-xs text-gray-400">pts</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 text-center text-xs text-gray-400">
        Keep sending kudos to climb the leaderboard!
      </div>
    </div>
  );
}
