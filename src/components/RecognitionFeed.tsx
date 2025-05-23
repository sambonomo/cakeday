"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useAuth } from "../context/AuthContext";
import KudosBadge from "./KudosBadge";
import UserAvatar from "./UserAvatar";
import { PartyPopper, Handshake, Lightbulb, Users, Star, Award, Smile, Trophy, UserCheck, Target, HeartHandshake } from "lucide-react";

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

// Map badge labels to Lucide icons
const BADGE_ICONS: Record<string, React.ElementType> = {
  "Team Player": Handshake,
  Innovator: Lightbulb,
  Leadership: Users,
  "Extra Mile": Star,
  "Problem Solver": Award,
  Cheerleader: Smile,
  Rockstar: Trophy,
  "Customer Hero": UserCheck,
  "Sharp Shooter": Target,
  Kindness: HeartHandshake,
};

function timeAgo(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hr ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return date.toLocaleDateString();
}

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
      setKudos(result);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [companyId]);

  if (loading)
    return <div className="text-gray-600">Loading recognition feed...</div>;

  if (kudos.length === 0)
    return (
      <div className="text-gray-500 flex flex-col items-center py-8">
        <PartyPopper className="w-8 h-8 mb-2 text-blue-400" />
        No kudos given yet. Be the first to celebrate a teammate!
      </div>
    );

  return (
    <ul className="flex flex-col gap-4">
      {kudos.map((kudo) => {
        const created =
          kudo.createdAt?.seconds !== undefined
            ? new Date(kudo.createdAt.seconds * 1000)
            : new Date();
        const badgeLabel = kudo.badgeLabel || kudo.badge;
        const IconComponent = BADGE_ICONS[badgeLabel] || Star;
        return (
          <li
            key={kudo.id}
            className="bg-white/90 border border-blue-100 rounded-2xl shadow-lg p-4 flex flex-col sm:flex-row sm:items-center gap-2 animate-fade-in"
          >
            {/* Giver */}
            <div className="flex items-center gap-2 min-w-[150px]">
              <UserAvatar
                nameOrEmail={kudo.fromName || kudo.fromEmail}
                photoURL={kudo.fromPhotoURL}
                size={36}
              />
              <span className="font-semibold text-blue-700">{kudo.fromName || kudo.fromEmail}</span>
            </div>
            <span className="text-gray-500 text-xs font-medium px-1">gave kudos to</span>

            {/* Recipient */}
            <div className="flex items-center gap-2 min-w-[150px]">
              <UserAvatar
                nameOrEmail={kudo.toName || kudo.toEmail}
                photoURL={kudo.toPhotoURL}
                size={36}
              />
              <span className="font-semibold text-green-700">{kudo.toName || kudo.toEmail}</span>
            </div>

            {/* Badge */}
            {kudo.badge && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 border border-green-200 ml-1">
                <KudosBadge
                  Icon={IconComponent}
                  label={badgeLabel}
                  size="md"
                />
                <span className="text-xs font-semibold text-green-800">{badgeLabel}</span>
              </div>
            )}

            {/* Message */}
            <span className="italic text-brand-800 text-base flex-1 px-2 py-1">
              “{kudo.message}”
            </span>

            {/* Time */}
            <span className="ml-auto text-xs text-gray-400">
              {timeAgo(created)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
