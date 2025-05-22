"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import dynamic from "next/dynamic";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { fetchAllUsers, getUpcomingEvents, UserEvent } from "../../lib/firestoreUsers";
import Toast from "../../components/Toast";
import Leaderboard from "../../components/Leaderboard";

// Dynamic imports (client-side only)
const OnboardingChecklist = dynamic(() => import("../../components/OnboardingChecklist"), {
  ssr: false,
});
const OffboardingChecklist = dynamic(() => import("../../components/OffboardingChecklist"), {
  ssr: false,
});
const AssignedTasksDashboard = dynamic(() => import("../../components/AssignedTasksDashboard"), {
  ssr: false,
});
const AdminOnboardingTasks = dynamic(() => import("../../components/AdminOnboardingTasks"), {
  ssr: false,
});
const GiveKudosForm = dynamic(() => import("../../components/GiveKudosForm"), {
  ssr: false,
});
const RecognitionFeed = dynamic(() => import("../../components/RecognitionFeed"), {
  ssr: false,
});
const BirthdayAnniversaryFeed = dynamic(() => import("../../components/BirthdayAnniversaryFeed"), {
  ssr: false,
});

export default function DashboardPage(): React.ReactElement {
  const { user, role, logout, loading, companyId } = useAuth();
  const router = useRouter();

  // Invite Code State (for admins)
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Today’s Event Toast state
  const [todayEvents, setTodayEvents] = useState<UserEvent[]>([]);
  const [showTodayToast, setShowTodayToast] = useState<boolean>(true);

  useEffect(() => {
    async function fetchInviteCode() {
      if (role === "admin" && companyId) {
        const companyDoc = await getDoc(doc(db, "companies", companyId));
        if (companyDoc.exists()) {
          setInviteCode(companyDoc.data().inviteCode || null);
        }
      }
    }
    fetchInviteCode();
  }, [role, companyId]);

  useEffect(() => {
    if (!loading && (!user || !companyId)) {
      router.replace("/login");
    }
  }, [user, loading, companyId, router]);

  useEffect(() => {
    if (!loading && user && companyId) {
      fetchAllUsers(companyId).then((users) => {
        const allEvents = getUpcomingEvents(users);
        const todays = allEvents.filter((ev) => ev.daysUntil === 0);
        setTodayEvents(todays);
        setShowTodayToast(todays.length > 0);
      });
    }
  }, [loading, user, companyId]);

  // Show a spinner while loading auth or company
  if (loading || !user || !companyId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-white via-brand-50 to-accent-50">
        <div className="text-lg text-brand-600 animate-pulse">Loading your dashboard...</div>
      </div>
    );
  }

  // Today's events banner text
  const todayMsg = todayEvents.length
    ? todayEvents
        .map(
          (ev) =>
            `${ev.type === "birthday" ? "🎂" : "🎉"} ${
              ev.user.fullName || ev.user.email
            }'s ${
              ev.type === "birthday" ? "birthday" : "work anniversary"
            } is today!`
        )
        .join("  ")
    : "";

  // Determine user status for left panel
  const isNewHire = user.status === "newHire";
  const isExiting = user.status === "exiting";
  const displayName = user.fullName || user.email || "User";

  // Left panel: Onboarding or Offboarding
  const leftPanel = isNewHire ? (
    <section className="card-panel border-brand-100">
      <h2 className="text-2xl font-bold flex items-center gap-2 text-brand-700">
        <span className="text-2xl" role="img" aria-label="Clipboard">
          📋
        </span>
        Onboarding Checklist
      </h2>
      <OnboardingChecklist companyId={companyId} />
    </section>
  ) : isExiting ? (
    <section className="card-panel border-red-100">
      <h2 className="text-2xl font-bold flex items-center gap-2 text-red-600">
        <span className="text-2xl" role="img" aria-label="Wave goodbye">
          👋
        </span>
        Offboarding Checklist
      </h2>
      <OffboardingChecklist companyId={companyId} />
    </section>
  ) : null;

  // Assigned tasks (for all users)
  const assignedSection = (
    <section className="card-panel border-blue-100">
      <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-700">
        <span className="text-xl" role="img" aria-label="Files icon">
          🗂️
        </span>
        My Assigned Tasks
      </h2>
      <AssignedTasksDashboard />
    </section>
  );

  // Events / Celebrations
  const eventsSection = (
    <section className="card-panel border-accent-100">
      <h2 className="text-2xl font-bold flex items-center gap-2 text-accent-700">
        <span className="text-xl" role="img" aria-label="Confetti">
          🎉
        </span>
        Birthdays &amp; Anniversaries
      </h2>
      <BirthdayAnniversaryFeed companyId={companyId} />
    </section>
  );

  // Admin Onboarding Tasks panel
  const adminPanel = (
    <section className="w-full card-panel border-brand-200 shadow-2xl items-center mt-8">
      <h2 className="text-xl font-semibold mb-3 text-brand-800 flex items-center gap-2">
        <span role="img" aria-label="Admin Tools">
          🛠️
        </span>
        Admin Onboarding Tasks
      </h2>
      <AdminOnboardingTasks companyId={companyId} />
    </section>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-tr from-white via-brand-50 to-accent-50">
      {/* Invite Code Bar for Admins */}
      {role === "admin" && inviteCode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5 max-w-2xl mx-auto mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 shadow">
          <div>
            <span className="font-bold text-yellow-700">Company Invite Code:</span>{" "}
            <span className="font-mono bg-yellow-100 rounded px-2 py-1 text-yellow-900 text-lg tracking-widest">
              {inviteCode}
            </span>
          </div>
          <button
            className="px-4 py-2 rounded bg-yellow-400 text-white font-semibold hover:bg-yellow-500 transition"
            onClick={() => {
              navigator.clipboard.writeText(inviteCode || "");
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            }}
            title="Copy code to clipboard"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      )}

      {/* Hero Header */}
      <header className="w-full flex flex-col items-center justify-center px-4 pt-12 pb-8 bg-gradient-to-br from-brand-100 via-accent-50 to-accent-100 shadow-lg mb-4">
        <div className="flex items-center gap-6 mb-4">
          <span className="text-6xl animate-bounce select-none" role="img" aria-label="Cake">
            🎂
          </span>
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-brand-800 drop-shadow text-center mb-1">
              Welcome, <span className="text-accent-500">{displayName}</span>
            </h1>
            <div className="text-brand-600 text-lg font-medium mt-2 text-center">
              Build a thriving, celebrated team!
            </div>
          </div>
        </div>
        <div className="flex gap-4 items-center mt-4">
          <a
            href="/directory"
            className="text-brand-600 underline text-base font-medium hover:text-brand-800 transition"
          >
            Directory
          </a>
          <button
            onClick={logout}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Today’s Event Toast/Banner */}
      {todayMsg && showTodayToast && (
        <Toast message={todayMsg} type="success" onClose={() => setShowTodayToast(false)} />
      )}

      {/*
        MAIN content area:
        - Added id="main-content" for Skip Link accessibility
      */}
      <main
        id="main-content"
        className="flex-1 w-full max-w-6xl mx-auto px-2 md:px-8 flex flex-col gap-10"
      >
        {/* Leaderboard */}
        <section className="mb-6">
          <Leaderboard companyId={companyId} limit={10} />
        </section>

        {/* Task panels & Events */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <div>
            {/* If newHire or exiting, show the leftPanel with the checklist */}
            {isNewHire && leftPanel}
            {isExiting && leftPanel}

            {/* Assigned tasks is always displayed */}
            {assignedSection}
          </div>
          <div>{eventsSection}</div>
        </section>

        {/* Employee Recognition Feed */}
        <section className="card-panel border-accent-100 mt-2">
          <h2 className="text-2xl font-bold mb-2 text-accent-600 flex items-center gap-2">
            <span role="img" aria-label="Kudos Hands">
              👏
            </span>{" "}
            Employee Recognition Feed
          </h2>
          <div className="mb-4">
            <GiveKudosForm companyId={companyId} />
          </div>
          <RecognitionFeed companyId={companyId} />
        </section>

        {/* Admin panel (onboarding tasks) */}
        {role === "admin" && adminPanel}
      </main>

      <footer className="py-6 text-center text-xs text-gray-500 bg-gradient-to-br from-brand-100 via-accent-50 to-white border-t border-brand-100 mt-10 w-full">
        &copy; {new Date().getFullYear()} Cakeday HR Onboarding &amp; Recognition •
      </footer>
    </div>
  );
}
