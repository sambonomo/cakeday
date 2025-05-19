"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import dynamic from "next/dynamic";

// Dynamic imports (client-side only)
const OnboardingChecklist = dynamic(() => import("../../components/OnboardingChecklist"), { ssr: false });
const AdminOnboardingTasks = dynamic(() => import("../../components/AdminOnboardingTasks"), { ssr: false });
const GiveKudosForm = dynamic(() => import("../../components/GiveKudosForm"), { ssr: false });
const RecognitionFeed = dynamic(() => import("../../components/RecognitionFeed"), { ssr: false });
const BirthdayAnniversaryFeed = dynamic(() => import("../../components/BirthdayAnniversaryFeed"), { ssr: false });

export default function DashboardPage(): JSX.Element {
  const { user, role, logout, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <header className="w-full flex items-center justify-between px-6 py-4 bg-white shadow">
        <h1 className="text-2xl font-bold text-blue-700">
          🎉 Welcome, {user.email}!
        </h1>
        <div className="flex gap-4 items-center">
          <a
            href="/directory"
            className="text-blue-600 underline text-sm font-medium hover:text-blue-800"
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
      <main className="flex-1 flex flex-col items-center justify-center gap-8 px-4">
        {/* Onboarding Checklist */}
        <section className="bg-white rounded-lg shadow p-6 w-full max-w-xl mt-8">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Onboarding Checklist</h2>
          <OnboardingChecklist />
        </section>

        {/* Admin panel only visible to admins */}
        {role === "admin" && (
          <section className="w-full flex flex-col items-center">
            <AdminOnboardingTasks />
          </section>
        )}

        {/* Employee Recognition Feed */}
        <section className="bg-white rounded-lg shadow p-6 w-full max-w-xl">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Employee Recognition Feed</h2>
          <GiveKudosForm />
          <RecognitionFeed />
        </section>

        {/* Birthdays & Anniversaries */}
        <section className="bg-white rounded-lg shadow p-6 w-full max-w-xl">
          <h2 className="text-xl font-semibold mb-4 text-blue-700">Birthdays & Anniversaries</h2>
          <BirthdayAnniversaryFeed />
        </section>
      </main>
      <footer className="py-4 text-center text-xs text-gray-400 bg-gray-100">
        &copy; {new Date().getFullYear()} Cakeday HR Onboarding & Recognition
      </footer>
    </div>
  );
}
