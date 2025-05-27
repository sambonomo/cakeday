"use client";

import React from "react";
import { useAuth } from "../../../context/AuthContext";
import AdminOnboardingTasks from "../../../components/AdminOnboardingTasks";

export default function AdminOnboardingPage() {
  const { role } = useAuth();

  // Guard for non-admin users
  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="bg-white rounded-xl p-8 shadow text-center max-w-lg border border-red-100">
          <h2 className="text-2xl font-bold text-red-600 mb-3">Admin Only</h2>
          <p className="text-gray-500">
            Only admins can view and edit onboarding tasks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        flex flex-col items-center min-h-[70vh]
        px-2 sm:px-4 py-8
        bg-gradient-to-tr from-white via-brand-50 to-accent-50
      "
    >
      <div
        className="
          w-full max-w-3xl glass-card
          rounded-3xl shadow-2xl p-8 border border-brand-100
          animate-fade-in
        "
        aria-label="Admin onboarding builder"
      >
        <h1 className="text-3xl font-extrabold text-brand-700 mb-6 flex items-center gap-2">
          <span role="img" aria-label="clipboard">
            📋
          </span>
          Onboarding Tasks
        </h1>
        <p className="mb-6 text-gray-600 text-sm">
          Build, edit, and reorder your company’s onboarding steps. Drag to
          reorder, add descriptions, and automate key tasks!
        </p>
        <AdminOnboardingTasks />
      </div>
    </div>
  );
}
