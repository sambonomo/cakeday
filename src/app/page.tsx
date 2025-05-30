import Link from "next/link";
import {
  Sparkles,
  Cake,
  Handshake,
  Trophy,
  CheckCircle2,
  Calendar,
  PartyPopper,
  Users,
  NotebookPen,
  ArrowRight,
  UserPlus,
} from "lucide-react";

export default function Home(): React.ReactElement {
  return (
    <div
      className="
        relative flex flex-col items-center justify-center
        min-h-screen
        bg-gradient-to-tr from-white via-brand-50 to-accent-50
        dark:from-gray-900 dark:via-indigo-950 dark:to-blue-950
        transition-all px-4
      "
    >
      {/* Accessible Skip Link */}
      <a
        href="#home-content"
        className="
          sr-only
          focus:not-sr-only
          absolute
          top-4 left-4
          bg-blue-700
          text-white
          px-4 py-2
          rounded
          z-50
          font-bold
        "
      >
        Skip to main content
      </a>

      {/* Decorative Hero Illustration */}
      <div className="absolute inset-x-0 top-0 z-0 flex justify-center pointer-events-none select-none">
        <img
          src="/cakeday-hero.svg"
          alt=""
          className="w-44 h-44 sm:w-60 sm:h-60 mt-8 opacity-60 blur-[1.5px] animate-fade-in"
          aria-hidden="true"
        />
      </div>

      <main
        id="home-content"
        className="
          z-10 flex flex-col items-center gap-8 w-full max-w-lg
          glass-card
          bg-white/80 dark:bg-gray-900/80
          rounded-3xl hero-shadow p-10 mt-20
          backdrop-blur-lg border border-brand-100 dark:border-slate-800
          animate-fade-in
        "
        tabIndex={-1}
        aria-label="Welcome to Cakeday HR"
      >
        <h1
          className="
            text-4xl sm:text-5xl font-extrabold text-brand-800
            dark:text-white text-center drop-shadow-md
            animate-fade-in-up
          "
        >
          <PartyPopper className="inline w-10 h-10 text-accent-500 mb-1 mr-2" aria-hidden="true" />
          Cakeday <span className="text-accent-500">HR</span>
        </h1>

        <p
          className="
            text-lg text-gray-700 dark:text-gray-200 text-center
            font-medium animate-fade-in-up
          "
        >
          Build a thriving culture!{" "}
          <span className="text-brand-500 font-semibold">
            Onboarding, celebrations, peer recognition, and rewards
          </span>{" "}
          — all in one playful, easy-to-use hub.
        </p>

        {/* Features mini-grid */}
        <div className="grid grid-cols-2 gap-3 w-full max-w-xs mt-2 animate-fade-in-up">
          <div className="bg-green-50 dark:bg-green-950/60 rounded-xl flex items-center gap-2 p-2 shadow text-green-700 dark:text-green-200">
            <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
            <span className="font-semibold">Checklists</span>
          </div>
          <div className="bg-yellow-50 dark:bg-yellow-900/60 rounded-xl flex items-center gap-2 p-2 shadow text-yellow-700 dark:text-yellow-200">
            <Cake className="w-5 h-5" aria-hidden="true" />
            <span className="font-semibold">Auto Birthdays</span>
          </div>
          <div className="bg-pink-50 dark:bg-pink-900/60 rounded-xl flex items-center gap-2 p-2 shadow text-pink-700 dark:text-pink-200">
            <Handshake className="w-5 h-5" aria-hidden="true" />
            <span className="font-semibold">Kudos</span>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/60 rounded-xl flex items-center gap-2 p-2 shadow text-blue-700 dark:text-blue-200">
            <Trophy className="w-5 h-5" aria-hidden="true" />
            <span className="font-semibold">Rewards</span>
          </div>
        </div>

        {/* CTA Buttons */}
        <div
          className="
            flex flex-col sm:flex-row gap-4 mt-6 w-full
            justify-center items-center
            animate-fade-in-up
          "
        >
          <Link
            href="/signup"
            className="
              bg-gradient-to-r from-brand-600 via-accent-500 to-accent-600
              text-white px-8 py-2 rounded-xl font-bold shadow-md
              hover:scale-105 hover:from-brand-700 hover:to-accent-700
              transition-transform duration-150 text-center
              focus:outline focus:ring-2 focus:ring-accent-400
              flex items-center gap-2
            "
          >
            <UserPlus className="w-5 h-5" /> Get Started
          </Link>
          <Link
            href="/login"
            className="
              bg-white dark:bg-gray-900 border border-brand-200 dark:border-brand-700
              text-brand-700 dark:text-brand-200 px-8 py-2
              rounded-xl font-bold shadow
              hover:bg-brand-50 dark:hover:bg-brand-950
              hover:scale-105 transition-transform
              duration-150 text-center
              focus:outline focus:ring-2 focus:ring-accent-400
              flex items-center gap-2
            "
          >
            <ArrowRight className="w-5 h-5" /> Log In
          </Link>
        </div>
        <div className="flex justify-center w-full mt-2">
          <span className="text-xs text-accent-600 italic">
            Want a demo?{" "}
            <Link
              href="/login"
              className="underline hover:text-accent-800 font-semibold"
            >
              Try the Demo
            </Link>
          </span>
        </div>

        {/* Why Cakeday / Social Proof */}
        <div className="mt-8 mb-1 px-4">
          <div className="text-accent-700 text-base font-semibold text-center mb-2 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" /> Loved by modern teams &amp; small businesses!
          </div>
          <div className="flex gap-2 justify-center flex-wrap text-sm text-gray-500">
            <span>✓ 10x more engagement</span>
            <span>•</span>
            <span>✓ Effortless onboarding</span>
            <span>•</span>
            <span>✓ Real-time celebrations</span>
          </div>
        </div>

        {/* How It Works: visible on md+ */}
        <div className="w-full mt-5 border-t border-accent-100 pt-6 hidden md:block">
          <div className="flex items-center justify-center gap-8">
            <div className="flex flex-col items-center text-center">
              <NotebookPen className="w-7 h-7 text-brand-500" aria-hidden="true" />
              <span className="text-xs mt-1 text-brand-700 font-bold">
                Add Employees
              </span>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400" />
            <div className="flex flex-col items-center text-center">
              <Calendar className="w-7 h-7 text-yellow-400" aria-hidden="true" />
              <span className="text-xs mt-1 text-accent-700 font-bold">
                Auto Celebrations
              </span>
            </div>
            <ArrowRight className="w-6 h-6 text-gray-400" />
            <div className="flex flex-col items-center text-center">
              <Sparkles className="w-7 h-7 text-pink-500" aria-hidden="true" />
              <span className="text-xs mt-1 text-pink-700 font-bold">
                Kudos &amp; Rewards
              </span>
            </div>
          </div>
        </div>

        <p className="mt-8 text-gray-400 text-xs text-center">
          Built with <span className="font-semibold">Next.js, Firebase &amp; Tailwind CSS</span> • {new Date().getFullYear()}
        </p>
      </main>

      {/* Floating bubbles for fun! */}
      <div className="absolute inset-0 -z-10 pointer-events-none animate-float-bubbles">
        <span
          className="absolute top-10 left-10 w-8 h-8 bg-brand-200 rounded-full opacity-40 animate-float"
        />
        <span
          className="absolute bottom-14 right-16 w-6 h-6 bg-accent-200 rounded-full opacity-30 animate-float-slower"
        />
        {/* Add more bubbles for visual fun! */}
      </div>
    </div>
  );
}
