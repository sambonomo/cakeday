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
const OnboardingChecklist = dynamic(
  () => import("../../components/OnboardingChecklist"),
  { ssr: false }
);
const OffboardingChecklist = dynamic(
  () => import("../../components/OffboardingChecklist"),
  { ssr: false }
);
// <-- NEW: Import the dashboard -->
const AssignedTasksDashboard = dynamic(
  () => import("../../components/AssignedTasksDashboard"),
  { ssr: false }
);
const AdminOnboardingTasks = dynamic(
  () => import("../../components/AdminOnboardingTasks"),
  { ssr: false }
);
const GiveKudosForm = dynamic(
  () => import("../../components/GiveKudosForm"),
  { ssr: false }
);
const RecognitionFeed = dynamic(
  () => import("../../components/RecognitionFeed"),
  { ssr: false }
);
const BirthdayAnniversaryFeed = dynamic(
  () => import("../../components/BirthdayAnniversaryFeed"),
  { ssr: false }
);

export default function DashboardPage(): React.ReactElement {
  const { user, role, logout, loading, companyId } = useAuth();
  const router = useRouter();

  // Invite Code State (for admins)
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 🎉 Today's Event Toast state
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
      <div
        className="
          flex items-center justify-center min-h-screen
          bg-gradient-to-tr from-white via-brand-50 to-accent-50
        "
      >
        <div className="text-lg text-brand-600 animate-pulse">
          Loading your dashboard...
        </div>
      </div>
    );
  }

  // Today's events banner text
  const todayMsg =
    todayEvents.length > 0
      ? todayEvents
          .map((ev) =>
            `${ev.type === "birthday" ? "🎂" : "🎉"} ${
              ev.user.fullName || ev.user.email
            }'s ${
              ev.type === "birthday" ? "birthday" : "work anniversary"
            } is today!`
          )
          .join("  ")
      : "";

  // -- MAIN LAYOUT LOGIC --

  // Onboarding/Offboarding Section Logic
  let onboardingSection = null;
  let offboardingSection = null;

  if (user.status === "newHire") {
    onboardingSection = (
      <div
        className="
          bg-white/90 rounded-2xl shadow-xl border border-brand-100
          p-6 flex flex-col mb-4
        "
      >
        <h2 className="text-2xl font-bold mb-2 text-brand-700 flex items-center gap-2">
          <span role="img" aria-label="Checklist">
            📋
          </span>{" "}
          Onboarding Checklist
        </h2>
        <OnboardingChecklist companyId={companyId} />
      </div>
    );
  } else if (user.status === "exiting") {
    offboardingSection = (
      <div
        className="
          bg-white/90 rounded-2xl shadow-xl border border-brand-100
          p-6 flex flex-col mb-4
        "
      >
        <h2 className="text-2xl font-bold mb-2 text-red-600 flex items-center gap-2">
          <span role="img" aria-label="Exit">
            👋
          </span>{" "}
          Offboarding Checklist
        </h2>
        <OffboardingChecklist companyId={companyId} />
      </div>
    );
  }

  // Assigned tasks for EVERY user (new hire, manager, IT, etc.)
  const assignedSection = (
    <AssignedTasksDashboard />
  );

  return (
    <div
      className="
        flex flex-col min-h-screen
        bg-gradient-to-tr from-white via-brand-50 to-accent-50
      "
    >
      {/* Invite Code Bar for Admins */}
      {role === "admin" && inviteCode && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4 max-w-2xl mx-auto mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
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

      {/* Dashboard Hero Header */}
      <header
        className="
          w-full flex flex-col items-center justify-center
          px-4 pt-10 pb-6
          bg-gradient-to-br from-brand-100 via-accent-50 to-accent-100
          shadow-md
        "
      >
        <div className="flex items-center gap-4">
          <span className="text-4xl md:text-5xl animate-bounce">🎂</span>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-brand-800 drop-shadow">
              Welcome, <span className="text-accent-500">{user.email}</span>
            </h1>
            <div className="text-brand-600 text-base md:text-lg font-medium mt-2">
              Build a thriving, celebrated team!
            </div>
          </div>
        </div>
        {/* Nav links */}
        <div className="flex gap-4 items-center mt-4">
          <a
            href="/directory"
            className="
              text-brand-600 underline text-sm font-medium
              hover:text-brand-800 transition
            "
          >
            Directory
          </a>
          <button
            onClick={logout}
            className="
              bg-red-500 hover:bg-red-600 text-white
              px-4 py-2 rounded transition
            "
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Today Event Toast/Banner */}
      {todayMsg && showTodayToast && (
        <Toast
          message={todayMsg}
          type="success"
          onClose={() => setShowTodayToast(false)}
        />
      )}

      <main
        className="
          flex-1 flex flex-col items-center gap-8
          px-2 py-8 md:px-8
          max-w-5xl mx-auto w-full
        "
      >
        {/* Leaderboard section */}
        <Leaderboard companyId={companyId} limit={10} />

        <section className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Smart logic: always show assignedSection.
            If newHire: show onboarding and assigned.
            If exiting: show offboarding and assigned.
            Otherwise: just assigned tasks. */}
          {user.status === "newHire" ? (
            <>
              {onboardingSection}
              {assignedSection}
            </>
          ) : user.status === "exiting" ? (
            <>
              {offboardingSection}
              {assignedSection}
            </>
          ) : (
            assignedSection
          )}

          {/* Birthdays & Anniversaries */}
          <div
            className="
              bg-white/90 rounded-2xl shadow-xl
              border border-accent-100
              p-6 flex flex-col mb-4
            "
          >
            <h2 className="text-2xl font-bold mb-2 text-accent-700 flex items-center gap-2">
              <span role="img" aria-label="Celebration">
                🎉
              </span>{" "}
              Birthdays &amp; Anniversaries
            </h2>
            <BirthdayAnniversaryFeed companyId={companyId} />
          </div>
        </section>

        {/* Employee Recognition Feed */}
        <section
          className="
            w-full bg-white/90 rounded-2xl shadow-xl
            border border-accent-100
            p-6 flex flex-col mt-2
          "
        >
          <h2 className="text-2xl font-bold mb-2 text-accent-600 flex items-center gap-2">
            <span role="img" aria-label="Kudos">
              👏
            </span>{" "}
            Employee Recognition Feed
          </h2>
          <div className="mb-4">
            <GiveKudosForm companyId={companyId} />
          </div>
          <RecognitionFeed companyId={companyId} />
        </section>

        {/* Admin panel only visible to admins */}
        {role === "admin" && (
          <section
            className="
              w-full bg-white/95 rounded-2xl shadow-2xl
              border border-brand-200 p-6 flex flex-col items-center mt-8
            "
          >
            <h2 className="text-xl font-semibold mb-3 text-brand-800 flex items-center gap-2">
              <span role="img" aria-label="Admin">
                🛠️
              </span>{" "}
              Admin Onboarding Tasks
            </h2>
            <AdminOnboardingTasks companyId={companyId} />
          </section>
        )}
      </main>
      <footer
        className="
          py-6 text-center text-xs text-gray-500
          bg-gradient-to-br from-brand-100 via-accent-50 to-white
          border-t border-brand-100 mt-10
        "
      >
        &copy; {new Date().getFullYear()} Cakeday HR Onboarding &amp; Recognition •
      </footer>
    </div>
  );
}
