"use client";
import { useAuth } from "../../context/AuthContext";
import EmployeeDirectory from "../../components/EmployeeDirectory";

export default function DirectoryPage() {
  const { companyId, loading, user } = useAuth();

  if (loading || !user || !companyId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-blue-50 via-pink-50 to-yellow-50">
        <div className="text-lg text-blue-600 animate-pulse">Loading directory...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-tr from-blue-50 via-white to-yellow-50">
      <section className="w-full flex flex-col items-center justify-center py-10 px-2 bg-gradient-to-br from-blue-100 via-pink-50 to-yellow-100 border-b border-blue-100 shadow">
        <div className="flex items-center gap-4">
          <span className="text-4xl md:text-5xl animate-pulse">👥</span>
          <h1 className="text-3xl md:text-4xl font-bold text-blue-800 drop-shadow">
            Employee Directory
          </h1>
        </div>
        <p className="mt-2 text-blue-600 text-base md:text-lg font-medium text-center">
          See your teammates, birthdays, roles & more!
        </p>
      </section>
      <main className="flex-1 flex flex-col items-center justify-center py-10 px-4">
        <EmployeeDirectory companyId={companyId} />
      </main>
      <footer className="py-6 text-center text-xs text-gray-500 bg-gradient-to-br from-blue-100 via-yellow-50 to-white border-t border-blue-100 mt-10">
        &copy; {new Date().getFullYear()} Cakeday HR Onboarding & Recognition
      </footer>
    </div>
  );
}
