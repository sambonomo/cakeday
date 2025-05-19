"use client";

import { useAuth } from "../../context/AuthContext";
import EmployeeDirectory from "../../components/EmployeeDirectory";

export default function DirectoryPage() {
  const { companyId, loading, user } = useAuth();

  if (loading || !user || !companyId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading directory...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <main className="flex-1">
        <EmployeeDirectory companyId={companyId} />
      </main>
    </div>
  );
}
