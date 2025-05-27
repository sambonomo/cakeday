"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import dynamic from "next/dynamic";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { fetchAllUsers, getUpcomingEvents, UserEvent } from "../../lib/firestoreUsers";
import Toast from "../../components/Toast";
import Leaderboard from "../../components/Leaderboard";
import {
  Cake,
  ClipboardList,
  Handshake,
  FolderKanban,
  PartyPopper,
  LogOut,
  User,
  Wrench,
} from "lucide-react";

// Dynamic imports for client-side only components
const OnboardingChecklist = dynamic(() => import("../../components/OnboardingChecklist"), { ssr: false });
const OffboardingChecklist = dynamic(() => import("../../components/OffboardingChecklist"), { ssr: false });
const AssignedTasksDashboard = dynamic(() => import("../../components/AssignedTasksDashboard"), { ssr: false });
const AdminOnboardingTasks = dynamic(() => import("../../components/AdminOnboardingTasks"), { ssr: false });
const GiveKudosForm = dynamic(() => import("../../components/GiveKudosForm"), { ssr: false });
const RecognitionFeed = dynamic(() => import("../../components/RecognitionFeed"), { ssr: false });
const BirthdayAnniversaryFeed = dynamic(() => import("../../components/BirthdayAnniversaryFeed"), { ssr: false });

export default function DashboardPage(): React.ReactElement {
  const { user, role, logout, loading, companyId } = useAuth();
  const router = useRouter();

  // Invite Code State (for admins)
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Today’s Event Toast state
  const [todayEvents, setTodayEvents] = useState<UserEvent[]>([]);
  const [showTodayToast, setShowTodayToast] = useState<boolean>(true);

  // Onboarding visibility & progress
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingIncomplete, setOnboardingIncomplete] = useState(false);
  const [showOnboardingNudge, setShowOnboardingNudge] = useState(false);

  // Confirm logout dialog & focus trap
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const logoutConfirmRef = useRef<HTMLDivElement>(null);

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

  // --- Onboarding visibility logic ---
  useEffect(() => {
    async function checkOnboarding() {
      if (user && companyId && (user.status === "newHire" || user.status === "active")) {
        // userTaskProgress/{companyId}_{user.uid}
        const progressDoc = await getDoc(doc(db, "userTaskProgress", `${companyId}_${user.uid}`));
        if (progressDoc.exists()) {
          const data = progressDoc.data() || {};
          const hasIncomplete = Object.values(data).some(v => v === false);
          setOnboardingIncomplete(hasIncomplete);
          setShowOnboarding(hasIncomplete);
          setShowOnboardingNudge(hasIncomplete);
        } else {
          setOnboardingIncomplete(true);
          setShowOnboarding(true);
          setShowOnboardingNudge(true);
        }
      } else {
        setOnboardingIncomplete(false);
        setShowOnboarding(false);
        setShowOnboardingNudge(false);
      }
    }
    checkOnboarding();
  }, [user, companyId]);

  // Focus trap for logout modal
  useEffect(() => {
    if (showLogoutConfirm && logoutConfirmRef.current) {
      logoutConfirmRef.current.focus();
    }
  }, [showLogoutConfirm]);

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
            `${
              ev.type === "birthday"
                ? "🎂"
                : "🎉"
            } ${ev.user.fullName || ev.user.email}'s ${
              ev.type === "birthday" ? "birthday" : "work anniversary"
            } is today!`
        )
        .join("  ")
    : "";

  const isExiting = user.status === "exiting";
  const displayName = user.fullName || user.email || "User";

  // Left panel: Onboarding or Offboarding
  const leftPanel = showOnboarding ? (
    <section className="card-panel border-brand-100 relative">
      <h2 className="text-2xl font-bold flex items-center gap-2 text-brand-700">
        <ClipboardList className="w-6 h-6 text-brand-500" aria-hidden="true" />
        Onboarding Checklist
      </h2>
      {showOnboardingNudge && (
        <div className="absolute right-4 top-2 bg-yellow-200 text-yellow-900 rounded px-3 py-1 text-xs font-semibold animate-bounce shadow-lg">
          👋 Start here!
        </div>
      )}
      <OnboardingChecklist companyId={companyId} />
    </section>
  ) : isExiting ? (
    <section className="card-panel border-red-100">
      <h2 className="text-2xl font-bold flex items-center gap-2 text-red-600">
        <LogOut className="w-6 h-6 text-red-500" aria-hidden="true" />
        Offboarding Checklist
      </h2>
      <OffboardingChecklist companyId={companyId} />
    </section>
  ) : null;

  // Assigned tasks (for all users)
  const assignedSection = (
    <section className="card-panel border-blue-100">
      <h2 className="text-2xl font-bold flex items-center gap-2 text-blue-700">
        <FolderKanban className="w-6 h-6 text-blue-400" aria-hidden="true" />
        My Assigned Tasks
      </h2>
      <AssignedTasksDashboard />
    </section>
  );

  // Events / Celebrations
  const eventsSection = (
    <section className="card-panel border-accent-100">
      <h2 className="text-2xl font-bold flex items-center gap-2 text-accent-700">
        <PartyPopper className="w-6 h-6 text-pink-500" aria-hidden="true" />
        Birthdays &amp; Anniversaries
      </h2>
      <BirthdayAnniversaryFeed companyId={companyId} />
    </section>
  );

  // Admin Onboarding Tasks panel
  const adminPanel = (
    <section className="w-full card-panel border-brand-200 shadow-2xl items-center mt-8">
      <h2 className="text-xl font-semibold mb-3 text-brand-800 flex items-center gap-2">
        <Wrench className="w-5 h-5 text-brand-700" aria-hidden="true" />
        Admin Onboarding Tasks
      </h2>
      <AdminOnboardingTasks companyId={companyId} />
    </section>
  );

  // Highlight active nav link (Directory as an example)
  const isActiveRoute = (path: string) =>
    typeof window !== "undefined" && window.location.pathname === path;

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
          <Cake className="text-pink-600 w-16 h-16 drop-shadow" aria-hidden="true" />
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
            className={`text-brand-600 underline text-base font-medium hover:text-brand-800 transition ${isActiveRoute("/directory") ? "font-bold text-accent-600" : ""}`}
            aria-current={isActiveRoute("/directory") ? "page" : undefined}
          >
            Directory
          </a>
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition"
            aria-label="Log Out"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Confirm Logout Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" aria-modal="true" role="dialog">
          <div
            ref={logoutConfirmRef}
            className="bg-white rounded-lg shadow-xl p-8 max-w-sm w-full"
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-bold mb-4">Are you sure you want to log out?</h3>
            <div className="flex gap-4 justify-end">
              <button
                className="px-4 py-2 bg-gray-200 rounded"
                onClick={() => setShowLogoutConfirm(false)}
                aria-label="Cancel log out"
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-500 text-white rounded"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  logout();
                }}
                aria-label="Confirm log out"
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Today’s Event Toast/Banner */}
      {todayMsg && showTodayToast && (
        <Toast message={todayMsg} type="success" onClose={() => setShowTodayToast(false)} />
      )}

      {/* Main content area */}
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
            {showOnboarding && leftPanel}
            {isExiting && leftPanel}
            {assignedSection}
          </div>
          <div>{eventsSection}</div>
        </section>

        {/* Recognition Form + Feed as ONE Card */}
        <section
          className="
            border border-accent-100 rounded-2xl mt-2 shadow-xl
            max-w-3xl mx-auto bg-white/90
            p-0 overflow-hidden
            flex flex-col
          "
          aria-label="Kudos recognition section"
        >
          <div className="px-8 pt-8 pb-4 bg-gradient-to-r from-accent-50 via-white to-accent-100">
            <h2 className="text-2xl font-bold mb-1 text-accent-700 flex items-center gap-2">
              <Handshake className="w-6 h-6 text-accent-400" aria-hidden="true" />
              Employee Recognition
            </h2>
            <p className="text-accent-500 text-sm mb-2">Give kudos and celebrate wins across your team!</p>
            <GiveKudosForm companyId={companyId} />
          </div>
          <div className="h-px w-full bg-accent-100" />
          <div className="px-6 pb-7 pt-6 bg-white/85">
            <RecognitionFeed companyId={companyId} />
          </div>
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
