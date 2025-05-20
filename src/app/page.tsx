import Link from "next/link";

export default function Home(): React.ReactElement {
  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-gradient-to-tr from-blue-100 via-pink-50 to-yellow-50 dark:from-gray-900 dark:via-indigo-950 dark:to-blue-950 transition-all px-4">
      {/* Animated Hero SVG Illustration */}
      <div className="absolute inset-x-0 top-0 z-0 flex justify-center pointer-events-none select-none">
        {/* If you want your own SVG illustration, place it here! */}
        <img
          src="/cakeday-hero.svg"
          alt=""
          className="w-44 h-44 sm:w-60 sm:h-60 mt-8 opacity-60 blur-[1.5px] animate-fade-in"
          aria-hidden="true"
        />
      </div>

      <main
        className="z-10 flex flex-col items-center gap-8 w-full max-w-lg glass-card bg-white/80 dark:bg-gray-900/80 rounded-3xl shadow-2xl p-10 mt-20 backdrop-blur-lg border border-blue-100 dark:border-slate-800 animate-fade-in"
        style={{
          boxShadow:
            "0 8px 40px 0 #c7d2fe88, 0 1.5px 4px 0 #2563eb22",
        }}
      >
        <h1 className="text-4xl sm:text-5xl font-extrabold text-blue-800 dark:text-white text-center drop-shadow-md animate-fade-in-up">
          🎉 Cakeday <span className="text-pink-500">HR</span>
        </h1>
        <p className="text-lg text-gray-700 dark:text-gray-200 text-center font-medium animate-fade-in-up">
          Supercharge your team’s experience with beautiful onboarding checklists, automated celebrations,
          and <span className="text-blue-500 font-semibold">peer recognition</span>—all in one playful, easy-to-use hub.
        </p>

        {/* Features Section */}
        <ul className="w-full max-w-xs text-gray-700 dark:text-gray-100 text-base glass-card bg-blue-50/60 dark:bg-blue-900/60 rounded-xl shadow p-4 mt-2 space-y-2 animate-fade-in-up">
          <li className="flex items-center gap-2">
            <span className="text-green-500 text-lg">✔️</span>
            <span className="font-semibold">Onboarding Checklists</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-yellow-400 text-lg">🎂</span>
            <span className="font-semibold">Auto Birthdays & Anniversaries</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-pink-400 text-lg">🤝</span>
            <span className="font-semibold">Peer Kudos</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="text-blue-600 text-lg">🔒</span>
            <span className="font-semibold">Company-Only Access</span>
          </li>
        </ul>

        {/* CTA Buttons */}
        <div className="flex gap-4 mt-4 animate-fade-in-up">
          <Link
            href="/signup"
            className="bg-gradient-to-r from-blue-600 via-indigo-500 to-pink-500 text-white px-8 py-2 rounded-xl font-bold shadow-md hover:scale-105 hover:from-blue-700 hover:to-pink-600 transition-transform duration-150"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-200 px-8 py-2 rounded-xl font-bold shadow hover:bg-blue-50 dark:hover:bg-blue-950 hover:scale-105 transition-transform duration-150"
          >
            Log In
          </Link>
        </div>
        <p className="mt-8 text-gray-400 text-xs text-center">
          Built with <span className="font-semibold">Next.js, Firebase &amp; Tailwind CSS</span> • {new Date().getFullYear()}
        </p>
      </main>

      {/* Subtle floating animated bubbles */}
      <div className="absolute inset-0 -z-10 pointer-events-none animate-float-bubbles">
        {/* Add cute floating shapes or SVGs for extra polish if desired */}
      </div>
    </div>
  );
}
