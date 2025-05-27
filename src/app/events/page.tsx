"use client";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { fetchAllUsers, getUpcomingEvents, UserEvent } from "../../lib/firestoreUsers";
import { PartyPopper, Cake, Moon } from "lucide-react";

export default function EventsPage(): React.ReactElement {
  const { companyId, loading, user } = useAuth();
  const [events, setEvents] = useState<UserEvent[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    setFetching(true);
    fetchAllUsers(companyId).then((users) => {
      const evts = getUpcomingEvents(users).filter(
        (ev) => ev.daysUntil >= 0 && ev.daysUntil <= 10
      );
      setEvents(evts);
      setFetching(false);
    });
  }, [companyId]);

  if (loading || fetching || !user || !companyId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-white via-brand-50 to-accent-50">
        <div className="text-lg text-brand-600 animate-pulse">
          Loading events...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-tr from-white via-brand-50 to-accent-50 px-2">
      {/* Hero header */}
      <section
        className="w-full flex flex-col items-center justify-center py-10 bg-gradient-to-br from-brand-100 via-accent-50 to-accent-100 border-b border-brand-100 shadow"
        aria-label="Upcoming events hero"
      >
        <div className="flex items-center gap-4">
          <PartyPopper className="text-accent-500 w-12 h-12 animate-bounce" aria-hidden="true" />
          <h1 className="text-3xl md:text-4xl font-extrabold text-brand-800 drop-shadow" tabIndex={0}>
            Upcoming Events
          </h1>
        </div>
        <p className="mt-2 text-brand-600 text-base md:text-lg font-medium text-center max-w-xl">
          Never miss a birthday or work anniversary!
        </p>
      </section>

      <main
        className="flex-1 flex flex-col items-center justify-center py-10 px-2"
        id="main-content"
        tabIndex={-1}
      >
        <div className="w-full max-w-2xl bg-white/95 rounded-3xl shadow-xl p-8 mt-8 mb-8">
          {events.length === 0 ? (
            <div className="flex flex-col items-center text-center py-10 text-gray-400">
              <Moon className="w-12 h-12 mb-4 animate-pulse" aria-hidden="true" />
              <div className="text-xl font-semibold">
                No upcoming birthdays or work anniversaries found.
              </div>
              <div className="text-xs text-gray-500 mt-2">
                Check back soon for more celebrations!
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-4" aria-live="polite">
              {events.map((event, idx) => (
                <li
                  key={idx}
                  className={`
                    flex flex-col sm:flex-row sm:items-center gap-2
                    border-2 rounded-2xl p-5 shadow-lg transition
                    ${
                      event.type === "birthday"
                        ? "bg-accent-50 border-accent-200"
                        : "bg-brand-50 border-brand-200"
                    }
                    ${
                      event.daysUntil === 0
                        ? "border-green-400 ring-2 ring-green-200"
                        : ""
                    }
                  `}
                  aria-label={`${event.user.fullName || event.user.email} ${event.type === "birthday" ? "birthday" : "work anniversary"}${event.daysUntil === 0 ? " is today!" : ` in ${event.daysUntil} days`}`}
                >
                  <span className="flex items-center gap-3 text-lg font-semibold">
                    {event.type === "birthday" ? (
                      <Cake className="w-6 h-6 text-yellow-400" aria-label="Birthday" />
                    ) : (
                      <PartyPopper className="w-6 h-6 text-pink-500" aria-label="Anniversary" />
                    )}
                    <span className="font-bold text-brand-800">
                      {event.user.fullName || event.user.email}
                    </span>
                    <span>
                      {event.type === "birthday"
                        ? "has a birthday"
                        : "celebrates a work anniversary"}
                    </span>
                    <span className="ml-2 font-bold text-green-700">
                      {event.daysUntil === 0
                        ? "today!"
                        : `in ${event.daysUntil} day${event.daysUntil === 1 ? "" : "s"}`}
                    </span>
                  </span>
                  <span className="ml-auto text-xs text-gray-500 italic">
                    {event.formatted}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <footer className="py-6 text-center text-xs text-gray-500 bg-gradient-to-br from-brand-100 via-accent-50 to-white border-t border-brand-100 mt-10">
        &copy; {new Date().getFullYear()} Cakeday HR Onboarding &amp; Recognition
      </footer>
    </div>
  );
}
