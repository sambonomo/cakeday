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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-blue-50 via-pink-50 to-yellow-50">
        <div className="text-lg text-blue-600 animate-pulse">Loading events...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-tr from-blue-50 via-white to-yellow-50 px-2">
      {/* Hero header */}
      <section className="w-full flex flex-col items-center justify-center py-10 bg-gradient-to-br from-yellow-100 via-pink-50 to-blue-100 border-b border-yellow-200 shadow">
        <div className="flex items-center gap-4">
          <span className="text-4xl md:text-5xl animate-bounce">🎉</span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-800 drop-shadow">Upcoming Events</h1>
        </div>
        <p className="mt-2 text-blue-600 text-base md:text-lg font-medium text-center">
          Never miss a birthday or work anniversary!
        </p>
      </section>

      <main className="flex-1 flex flex-col items-center justify-center py-10 px-2">
        <div className="w-full max-w-2xl bg-white/95 rounded-3xl shadow-xl p-8 mt-8 mb-8">
          {events.length === 0 ? (
            <div className="flex flex-col items-center text-center py-10 text-gray-400">
              <span className="text-6xl mb-4 animate-pulse">😴</span>
              <div className="text-xl font-semibold">No upcoming birthdays or work anniversaries found.</div>
              <div className="text-xs text-gray-500 mt-2">Check back soon for more celebrations!</div>
            </div>
          ) : (
            <ul className="flex flex-col gap-4">
              {events.map((event, idx) => (
                <li
                  key={idx}
                  className={`
                    flex flex-col sm:flex-row sm:items-center gap-2 border-2 rounded-2xl p-5 shadow-lg transition
                    ${event.type === "birthday"
                      ? "bg-gradient-to-r from-yellow-100 via-yellow-50 to-white border-yellow-200"
                      : "bg-gradient-to-r from-blue-100 via-blue-50 to-white border-blue-200"}
                    ${event.daysUntil === 0 ? "border-green-400 ring-2 ring-green-200" : ""}
                  `}
                >
                  <span className="flex items-center gap-3 text-lg font-semibold">
                    <span className="text-2xl">{event.type === "birthday" ? "🎂" : "🎉"}</span>
                    <span className="font-bold text-blue-800">{event.user.fullName || event.user.email}</span>
                    <span>
                      {event.type === "birthday" ? "has a birthday" : "celebrates a work anniversary"}
                    </span>
                    <span className="ml-2 font-bold text-green-700">
                      {event.daysUntil === 0
                        ? "today!"
                        : `in ${event.daysUntil} day${event.daysUntil === 1 ? "" : "s"}`}
                    </span>
                  </span>
                  <span className="ml-auto text-xs text-gray-500 italic">{event.formatted}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <footer className="py-6 text-center text-xs text-gray-500 bg-gradient-to-br from-blue-100 via-yellow-50 to-white border-t border-blue-100 mt-10">
        &copy; {new Date().getFullYear()} Cakeday HR Onboarding & Recognition
      </footer>
    </div>
  );
}
