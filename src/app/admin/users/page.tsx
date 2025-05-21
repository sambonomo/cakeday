"use client";

import React from "react";
import { useAuth } from "../../../context/AuthContext";
import AdminUserEditor from "../../../components/AdminUserEditor";

export default function AdminUsersPage() {
  const { role } = useAuth();

  if (role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-white rounded-xl p-8 shadow text-center max-w-lg">
          <h2 className="text-2xl font-bold text-blue-700 mb-3">Admin Only</h2>
          <p className="text-gray-500">
            Only admins can manage users. Please contact your company admin for access.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center min-h-[70vh] px-2 sm:px-4 py-8">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl glass-card p-8 border border-blue-100 animate-fade-in">
        <h1 className="text-3xl font-extrabold text-blue-700 mb-6 flex items-center gap-2">
          <span>👥</span> Manage Users
        </h1>
        <p className="mb-6 text-gray-600 text-sm">
          View, edit, disable, and change roles for all employees in your company.
        </p>
        <AdminUserEditor />
      </div>
    </div>
  );
}
