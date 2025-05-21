"use client";

import React from "react";
import { useAuth } from "../../../context/AuthContext";
import AdminOnboardingTasks from "../../../components/AdminOnboardingTasks";

export default function AdminOnboardingPage() {
  const { role } = useAuth();

  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl p-8 shadow text-center max-w-lg">
          <h2 className="text-2xl font-bold text-blue-700 mb-3">Admin Only</h2>
          <p className="text-gray-500">
            Only admins can view and edit onboarding tasks.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-[70vh] px-2 sm:px-4 py-8">
      <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl glass-card p-8 border border-blue-100 animate-fade-in">
        <h1 className="text-3xl font-extrabold text-blue-700 mb-6 flex items-center gap-2">
          <span>📋</span> Onboarding Tasks
        </h1>
        <p className="mb-6 text-gray-600 text-sm">
          Build, edit, and reorder your company’s onboarding steps. Drag to reorder, add descriptions, and automate key tasks!
        </p>
        <AdminOnboardingTasks />
      </div>
    </div>
  );
}
