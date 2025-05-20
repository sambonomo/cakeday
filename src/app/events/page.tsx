"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchAllUsers, getUpcomingEvents, UserEvent } from "../../lib/firestoreUsers";

export default function EventsPage(): React.ReactElement {
  const { companyId, loading, user } = useAuth();
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    setFetching(true);
    fetchAllUsers(companyId).then(users => {
      // Get all future events (including today)
      const evts = getUpcomingEvents(users).filter(ev => ev.daysUntil >= 0);
      setEvents(evts);
      setFetching(false);
    });
  }, [companyId]);

  if (loading || fetching || !user || !companyId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-screen bg-gray-50 px-4">
      <main className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8 mt-8">
        <h1 className="text-3xl font-bold text-blue-700 mb-6 text-center">
          🎉 Upcoming Events
        </h1>
        {events.length === 0 ? (
          <div className="text-gray-500 text-center">
            No upcoming birthdays or work anniversaries found.
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {events.map((event, idx) => (
              <li
                key={idx}
                className={`flex flex-col sm:flex-row sm:items-center gap-2 border rounded-lg p-4 shadow
                  ${event.type === "birthday" ? "bg-yellow-50 border-yellow-200" : "bg-blue-50 border-blue-200"}
                  ${event.daysUntil === 0 ? "border-2 border-green-400" : ""}
                `}
              >
                <span className="flex items-center gap-2">
                  <span className="text-xl">
                    {event.type === "birthday" ? "🎂" : "🎉"}
                  </span>
                  <span className="font-semibold">
                    {event.user.fullName || event.user.email}
                  </span>
                  {event.type === "birthday"
                    ? " has a birthday"
                    : " celebrates a work anniversary"}
                  <span className="font-semibold ml-2">
                    {event.daysUntil === 0
                      ? "today!"
                      : `in ${event.daysUntil} day${event.daysUntil === 1 ? "" : "s"}`}
                  </span>
                </span>
                <span className="ml-auto text-xs text-gray-400">
                  {event.formatted}
                </span>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
