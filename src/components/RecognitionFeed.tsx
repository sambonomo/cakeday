"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import KudosBadge from "./KudosBadge";
import UserAvatar from "./UserAvatar";

interface RecognitionFeedProps {
  companyId?: string;
}

type KudosWithProfile = {
  id: string;
  fromEmail: string;
  toEmail: string;
  fromPhotoURL?: string;
  toPhotoURL?: string;
  fromName?: string;
  toName?: string;
  badge: string;
  badgeLabel?: string;
  message: string;
  createdAt?: { seconds: number };
};

export default function RecognitionFeed({ companyId: propCompanyId }: RecognitionFeedProps) {
  const { companyId: contextCompanyId } = useAuth();
  const companyId = propCompanyId || contextCompanyId;

  const [kudos, setKudos] = useState<KudosWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);

    const kudosRef = collection(db, "kudos");
    const q = query(
      kudosRef,
      where("companyId", "==", companyId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const result: KudosWithProfile[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as KudosWithProfile[];

      // Get all user UIDs for profile pics (from and to)
      const uids = Array.from(
        new Set(
          result.flatMap((k) => [
            (k as any).fromUid,
            (k as any).toUid,
          ])
        )
      ).filter(Boolean);

      // Fetch profiles in batch if needed
      // Optional: if your kudos docs already have photoURL/name, skip this.
      // This is a scalable way if you want avatars to always be fresh.
      // For demo, let's use data from kudos doc only.

      setKudos(result);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [companyId]);

  if (loading) return <div className="text-gray-600">Loading recognition feed...</div>;
  if (kudos.length === 0) return <div className="text-gray-500">No kudos given yet.</div>;

  return (
    <ul className="flex flex-col gap-3">
      {kudos.map((kudo) => (
        <li
          key={kudo.id}
          className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow flex flex-col sm:flex-row sm:items-center gap-2"
        >
          <UserAvatar nameOrEmail={kudo.fromName || kudo.fromEmail} photoURL={(kudo as any).fromPhotoURL} size={36} />
          <span className="font-semibold text-blue-700">
            {kudo.fromName || kudo.fromEmail}
          </span>
          <span>gave kudos to</span>
          <UserAvatar nameOrEmail={kudo.toName || kudo.toEmail} photoURL={(kudo as any).toPhotoURL} size={36} />
          <span className="font-semibold text-green-700">{kudo.toName || kudo.toEmail}</span>
          <span className="italic text-gray-700">“{kudo.message}”</span>
          {kudo.badge && (
            <KudosBadge emoji={kudo.badge} label={kudo.badgeLabel} size="md" />
          )}
          <span className="ml-auto text-xs text-gray-400">
            {kudo.createdAt?.seconds
              ? new Date(kudo.createdAt.seconds * 1000).toLocaleString()
              : "just now"}
          </span>
        </li>
      ))}
    </ul>
  );
}
