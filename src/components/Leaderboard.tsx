"use client";

import { useEffect, useState } from "react";
import { fetchAllUsers, UserProfile } from "../lib/firestoreUsers";
import { useAuth } from "../context/AuthContext";
import { Crown, Star, Sparkles, Medal, Award } from "lucide-react";
import UserAvatar from "./UserAvatar";

// Map badge codes to readable labels and Lucide icons
const BADGE_DEFS: Record<string, { label: string; Icon: React.ElementType }> = {
  "first-kudos": { label: "First Kudos", Icon: Sparkles },
  "50-points": { label: "Level 1", Icon: Medal },
  "100-points": { label: "Level 2", Icon: Award },
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
  const { companyId: contextCompanyId, user: loggedInUser } = useAuth();
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
        .sort(
          (a, b) =>
            (b.points || 0) - (a.points || 0) ||
            (a.fullName || "").localeCompare(b.fullName || "")
        );
      setUsers(ranked);
      setLoading(false);
    });
  }, [companyId, limit]);

  // Slice for display
  const topUsers = users.slice(0, limit);

  // Find your position if not top N
  let selfRank = -1;
  if (loggedInUser) {
    selfRank = users.findIndex((u) => u.uid === loggedInUser.uid);
  }
  const selfOnBoard = selfRank >= limit && users[selfRank];

  if (loading)
    return (
      <div className="text-gray-500 text-center py-6">
        Loading leaderboard...
      </div>
    );
  if (users.length === 0)
    return (
      <div className="text-gray-400 flex flex-col items-center py-6">
        <Crown className="w-8 h-8 mb-1 text-yellow-300" />
        No kudos or points awarded yet.
      </div>
    );

  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl bg-white/90 border border-blue-100 shadow-md px-2 py-6 animate-fade-in">
      <h2 className="text-xl font-bold text-blue-800 flex items-center gap-2 mb-1 px-4">
        <Crown className="w-6 h-6 text-yellow-400 drop-shadow" /> Kudos Leaderboard
      </h2>
      <ul className="divide-y divide-blue-50">
        {topUsers.map((u, idx) => {
          const isTop = idx === 0;
          const isSelf = loggedInUser && u.uid === loggedInUser.uid;
          return (
            <li
              key={u.uid}
              className={`
                flex items-center gap-4 py-3 px-3 group transition
                ${isTop
                  ? "bg-gradient-to-r from-yellow-50 via-blue-50 to-white rounded-xl border-2 border-yellow-200 shadow"
                  : ""}
                ${isSelf && !isTop
                  ? "bg-green-50 border border-green-200 rounded-lg shadow-sm"
                  : ""}
                focus:ring-2 focus:ring-accent-400
                outline-none
              `}
              tabIndex={0}
              aria-label={
                `${idx === 0 ? "First place: " : ""}` +
                (u.fullName || u.email) +
                `. ${u.points || 0} points.`
              }
              title={isSelf ? "You" : u.fullName || u.email}
            >
              {/* Position / Crown */}
              <span className="text-lg font-bold w-7 flex-shrink-0 text-center select-none">
                {isTop ? (
                  <Crown className="inline w-6 h-6 text-yellow-400" aria-label="First place" />
                ) : (
                  idx + 1
                )}
              </span>
              {/* Avatar */}
              <UserAvatar
                nameOrEmail={u.fullName || u.email}
                photoURL={typeof u.photoURL === "string" ? u.photoURL : undefined}
                size={38}
                className={isSelf ? "ring-2 ring-green-500" : ""}
              />
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-blue-800 truncate flex gap-1 items-center">
                  {u.fullName || u.email}
                  {isSelf && (
                    <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">
                      You
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-400">{u.email}</div>
                {/* Badges */}
                <div className="flex gap-2 flex-wrap mt-1">
                  {(u.badges || []).map((b) => {
                    const badgeDef = BADGE_DEFS[b];
                    return badgeDef ? (
                      <span
                        key={b}
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 gap-1"
                        title={badgeDef.label}
                        aria-label={badgeDef.label}
                      >
                        <badgeDef.Icon className="w-4 h-4 text-yellow-400" />
                        {badgeDef.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
              {/* Points */}
              <div className="flex flex-col items-end justify-center min-w-[48px]">
                <span className="font-bold text-base text-blue-900 flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400" /> {u.points || 0}
                </span>
                <span className="text-xs text-gray-400">pts</span>
              </div>
            </li>
          );
        })}

        {/* Show user's own spot if not in top N */}
        {selfOnBoard && (
          <li
            className={`
              flex items-center gap-4 py-3 px-3 group outline-none bg-green-50 border border-green-200 rounded-lg shadow mt-2
              focus:ring-2 focus:ring-accent-400
            `}
            tabIndex={0}
            aria-label={`Your ranking: #${selfRank + 1} ${(selfOnBoard.fullName || selfOnBoard.email)}. ${selfOnBoard.points || 0} points.`}
            title="You"
          >
            <span className="text-lg font-bold w-7 flex-shrink-0 text-center select-none">{selfRank + 1}</span>
            <UserAvatar
              nameOrEmail={selfOnBoard.fullName || selfOnBoard.email}
              photoURL={typeof selfOnBoard.photoURL === "string" ? selfOnBoard.photoURL : undefined}
              size={38}
              className="ring-2 ring-green-500"
            />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-blue-800 truncate flex gap-1 items-center">
                {selfOnBoard.fullName || selfOnBoard.email}
                <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs font-bold">You</span>
              </div>
              <div className="text-xs text-gray-400">{selfOnBoard.email}</div>
              <div className="flex gap-2 flex-wrap mt-1">
                {(selfOnBoard.badges || []).map((b) => {
                  const badgeDef = BADGE_DEFS[b];
                  return badgeDef ? (
                    <span
                      key={b}
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200 gap-1"
                      title={badgeDef.label}
                      aria-label={badgeDef.label}
                    >
                      <badgeDef.Icon className="w-4 h-4 text-yellow-400" />
                      {badgeDef.label}
                    </span>
                  ) : null;
                })}
              </div>
            </div>
            <div className="flex flex-col items-end justify-center min-w-[48px]">
              <span className="font-bold text-base text-blue-900 flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400" /> {selfOnBoard.points || 0}
              </span>
              <span className="text-xs text-gray-400">pts</span>
            </div>
          </li>
        )}
      </ul>
      <div className="mt-3 text-center text-xs text-gray-400 px-2">
        Keep sending kudos to climb the leaderboard!
      </div>
    </div>
  );
}
