"use client";

import { useEffect, useState } from "react";
import { fetchAllUsers, getUpcomingEvents, UserEvent } from "../lib/firestoreUsers";
import { useAuth } from "../context/AuthContext";
import { Cake, PartyPopper } from "lucide-react";

interface BirthdayAnniversaryFeedProps {
  companyId?: string;
  maxEvents?: number; // allow unlimited if undefined
}

export default function BirthdayAnniversaryFeed({
  companyId: propCompanyId,
  maxEvents = 5,
}: BirthdayAnniversaryFeedProps) {
  const { companyId: contextCompanyId } = useAuth();
  const companyId = propCompanyId || contextCompanyId;

  const [events, setEvents] = useState<UserEvent[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    const fetchEvents = async () => {
      setLoading(true);
      const users = await fetchAllUsers(companyId);
      const evts = getUpcomingEvents(users).filter(ev => ev.daysUntil >= 0);
      setEvents(evts);
      setLoading(false);
    };
    fetchEvents();
  }, [companyId]);

  const toDisplay = showAll || maxEvents === undefined ? events : events.slice(0, maxEvents);

  if (loading)
    return (
      <div className="text-gray-600 flex items-center gap-2 animate-pulse">
        <PartyPopper className="w-5 h-5 animate-bounce" />
        Loading birthdays & anniversaries...
      </div>
    );
  if (events.length === 0)
    return (
      <div className="text-gray-500 flex flex-col items-center py-8">
        <PartyPopper className="w-8 h-8 mb-2 text-blue-400" />
        No upcoming birthdays or anniversaries.
      </div>
    );

  return (
    <div>
      <ul className="flex flex-col gap-3">
        {toDisplay.map((event, idx) => (
          <li
            key={idx}
            className={`border rounded-lg p-4 shadow flex flex-col sm:flex-row sm:items-center gap-2 transition
              ${event.type === "birthday" ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"}
              ${event.daysUntil === 0 ? "border-2 border-green-400 animate-wiggle" : ""}
            `}
            aria-current={event.daysUntil === 0 ? "true" : undefined}
            tabIndex={0}
          >
            <span className="flex items-center gap-2 font-medium text-lg">
              {event.type === "birthday" ? (
                <Cake className="w-6 h-6 text-yellow-400" aria-label="Birthday" />
              ) : (
                <PartyPopper className="w-6 h-6 text-blue-400" aria-label="Anniversary" />
              )}
              <span className="font-semibold">{event.user.fullName || event.user.email}</span>
              {event.type === "birthday"
                ? "has a birthday"
                : "celebrates a work anniversary"}
              <span className={`font-bold ml-2 ${event.daysUntil === 0 ? "text-green-700" : "text-blue-700"}`}>
                {event.daysUntil === 0
                  ? (
                      <>
                        <span role="img" aria-label="confetti">🎉</span> today!
                      </>
                    )
                  : `in ${event.daysUntil} day${event.daysUntil === 1 ? "" : "s"}`}
              </span>
            </span>
            <span className="ml-auto text-xs text-gray-400">{event.formatted}</span>
          </li>
        ))}
      </ul>
      {events.length > maxEvents && !showAll && (
        <button
          className="mt-2 text-blue-600 hover:underline font-semibold text-sm"
          onClick={() => setShowAll(true)}
        >
          Show all ({events.length})
        </button>
      )}
      {showAll && events.length > maxEvents && (
        <button
          className="mt-2 text-gray-500 hover:underline font-semibold text-xs"
          onClick={() => setShowAll(false)}
        >
          Show less
        </button>
      )}
      <style jsx global>{`
        @keyframes wiggle {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        .animate-wiggle { animation: wiggle 0.28s 2; }
      `}</style>
    </div>
  );
}
