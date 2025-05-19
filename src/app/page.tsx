import Link from "next/link";
// import React from "react"; // Optional with react-jsx

export default function Home(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <main className="flex flex-col items-center gap-8 w-full max-w-lg bg-white rounded-xl shadow-lg p-8 mt-8">
        <h1 className="text-3xl sm:text-4xl font-bold text-blue-700 text-center">
          🎉 Cakeday HR Onboarding & Recognition
        </h1>
        <p className="text-lg text-gray-700 text-center">
          Welcome! Create an engaging employee experience with onboarding checklists, automated celebrations, and peer recognition—all in one place.
        </p>
        <div className="flex gap-4 mt-4">
          <Link
            href="/signup"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Sign Up
          </Link>
          <Link
            href="/login"
            className="bg-gray-200 text-blue-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Log In
          </Link>
        </div>
        <p className="mt-8 text-gray-500 text-xs text-center">
          Built with Next.js, Firebase & Tailwind CSS • {new Date().getFullYear()}
        </p>
      </main>
    </div>
  );
}
