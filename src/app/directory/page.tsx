"use client";

import { useAuth } from "../../context/AuthContext";
import EmployeeDirectory from "../../components/EmployeeDirectory";
import { Users2 } from "lucide-react";

export default function DirectoryPage() {
  const { companyId, loading, user } = useAuth();

  if (loading || !user || !companyId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-white via-brand-50 to-accent-50">
        <div className="text-lg text-brand-600 animate-pulse">
          Loading directory...
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-tr from-white via-brand-50 to-accent-50">
      <section
        className="w-full flex flex-col items-center justify-center py-10 px-2 bg-gradient-to-br from-brand-100 via-accent-50 to-accent-100 border-b border-brand-100 shadow"
        aria-label="Directory hero"
      >
        <div className="flex items-center gap-4">
          <Users2 className="text-brand-500 w-12 h-12 animate-pulse" aria-hidden="true" />
          <h1 className="text-3xl md:text-4xl font-bold text-brand-800 drop-shadow" tabIndex={0}>
            Employee Directory
          </h1>
        </div>
        <p className="mt-2 text-brand-600 text-base md:text-lg font-medium text-center max-w-xl">
          See your teammates, birthdays, roles, departments &amp; more—all in one place!
        </p>
      </section>
      <main
        className="flex-1 flex flex-col items-center justify-center py-10 px-4 w-full"
        id="main-content"
        tabIndex={-1}
      >
        <EmployeeDirectory companyId={companyId} />
      </main>
      <footer className="py-6 text-center text-xs text-gray-500 bg-gradient-to-br from-brand-100 via-accent-50 to-white border-t border-brand-100 mt-10">
        &copy; {new Date().getFullYear()} Cakeday HR Onboarding &amp; Recognition
      </footer>
    </div>
  );
}
