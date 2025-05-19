"use client";

import { useEffect, useState } from "react";
import { fetchAllUsers, getUpcomingEvents } from "../lib/firestoreUsers";
import { useAuth } from "../context/AuthContext";

interface BirthdayAnniversaryFeedProps {
  companyId?: string;
}

export default function BirthdayAnniversaryFeed({ companyId: propCompanyId }: BirthdayAnniversaryFeedProps) {
  const { companyId: contextCompanyId } = useAuth();
  const companyId = propCompanyId || contextCompanyId;

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    const fetchEvents = async () => {
      setLoading(true);
      const users = await fetchAllUsers(companyId);
      const evts = getUpcomingEvents(users).filter(ev => ev.daysUntil >= 0);
      setEvents(evts.slice(0, 5)); // Show next 5 upcoming
      setLoading(false);
    };
    fetchEvents();
  }, [companyId]);

  if (loading) return <div className="text-gray-600">Loading...</div>;
  if (events.length === 0) return <div className="text-gray-500">No upcoming birthdays or anniversaries.</div>;

  return (
    <ul className="flex flex-col gap-3">
      {events.map((event, idx) => (
        <li key={idx} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 shadow flex flex-col sm:flex-row sm:items-center gap-2">
          <span>
            <span className="font-semibold">{event.user.email}</span>
            {event.type === "birthday" ? " has a birthday " : " celebrates a work anniversary "}
            <span className="font-semibold">{event.daysUntil === 0 ? "today!" : `in ${event.daysUntil} day${event.daysUntil === 1 ? "" : "s"}`}</span>
          </span>
          <span className="ml-auto text-xs text-gray-400">{event.formatted}</span>
        </li>
      ))}
    </ul>
  );
}
