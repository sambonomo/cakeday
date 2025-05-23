"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { Cake, KeyRound, LogIn, UserPlus, ArrowLeft } from "lucide-react";

export default function LoginPage(): React.ReactElement {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Password reset state
  const [resetMode, setResetMode] = useState<boolean>(false);
  const [resetEmail, setResetEmail] = useState<string>("");
  const [resetSent, setResetSent] = useState<boolean>(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // Redirect logged-in users to dashboard
  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/dashboard");
    }
  }, [authLoading, user, router]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      // Router redirect is handled by the useEffect if logged in
    } catch (err: any) {
      const msg = err?.message || "Login failed";
      if (msg.includes("auth/wrong-password")) {
        setError("Incorrect password.");
      } else if (msg.includes("auth/user-not-found")) {
        setError("No account found for that email.");
      } else {
        setError(msg);
      }
    }
    setLoading(false);
  };

  // Password reset handler
  const handlePasswordReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setResetError(null);
    setResetSent(false);
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      setResetSent(true);
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        setResetError("No account found for that email.");
      } else if (err.code === "auth/invalid-email") {
        setResetError("Please enter a valid email address.");
      } else {
        setResetError("Could not send password reset email. Try again.");
      }
    }
  };

  // Loading auth state
  if (authLoading) {
    return (
      <div
        className="
          flex items-center justify-center min-h-screen
          bg-gradient-to-br from-white via-brand-50 to-accent-50
        "
      >
        <div className="text-lg text-brand-600 animate-pulse">Loading...</div>
      </div>
    );
  }

  return (
    <div
      className="
        flex flex-col items-center justify-center min-h-screen
        bg-gradient-to-br from-white via-brand-50 to-accent-50
        px-4
      "
    >
      <main className="w-full max-w-md">
        <div className="flex flex-col items-center mb-4">
          <Cake className="text-pink-400 text-5xl mb-2 animate-bounce w-12 h-12" aria-hidden="true" />
          <h1 className="text-3xl font-extrabold text-brand-700 text-center drop-shadow">
            Welcome to Cakeday
          </h1>
          <p className="text-brand-600 text-base text-center mt-1 mb-3">
            Log in to celebrate, recognize, and thrive.
          </p>
        </div>

        {/* Login Form */}
        {!resetMode ? (
          <form
            onSubmit={handleLogin}
            className="
              bg-white/95 p-8 rounded-2xl shadow-xl w-full
              animate-fade-in
            "
          >
            <h2 className="text-xl font-semibold mb-5 text-center text-brand-700 flex items-center gap-2 justify-center">
              <LogIn className="w-6 h-6" /> Sign In
            </h2>
            {error && (
              <div className="text-red-600 mb-4 text-center font-medium">
                {error}
              </div>
            )}
            <input
              type="email"
              placeholder="Email"
              className="
                mb-4 w-full p-3 border-2 border-brand-100
                focus:border-brand-500 rounded-xl
                transition
              "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <input
              type="password"
              placeholder="Password"
              className="
                mb-4 w-full p-3 border-2 border-brand-100
                focus:border-brand-500 rounded-xl
                transition
              "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
            <button
              type="submit"
              className="
                btn btn-primary w-full text-lg flex items-center justify-center gap-2
                disabled:opacity-50
              "
              disabled={loading}
            >
              <LogIn className="w-5 h-5" />
              {loading ? "Logging In..." : "Log In"}
            </button>
            <div className="mt-4 flex flex-col items-center gap-2">
              <button
                type="button"
                className="text-brand-600 hover:underline text-sm flex items-center gap-1"
                onClick={() => {
                  setResetMode(true);
                  setResetEmail("");
                  setResetError(null);
                  setResetSent(false);
                }}
              >
                <KeyRound className="w-4 h-4" /> Forgot password?
              </button>
              <p className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <a
                  href="/signup"
                  className="text-brand-600 hover:underline font-semibold flex items-center gap-1"
                >
                  <UserPlus className="w-4 h-4" /> Sign Up
                </a>
              </p>
            </div>
          </form>
        ) : (
          /* Password Reset Form */
          <form
            onSubmit={handlePasswordReset}
            className="
              bg-white/95 p-8 rounded-2xl shadow-xl w-full
              animate-fade-in
            "
          >
            <h2 className="text-xl font-semibold mb-4 text-center text-brand-700 flex items-center gap-2 justify-center">
              <KeyRound className="w-6 h-6" /> Reset Password
            </h2>
            <p className="mb-4 text-center text-gray-700 text-sm">
              Enter your account email and we&apos;ll send you a password reset
              link.
            </p>
            <input
              type="email"
              placeholder="Your email"
              className="
                mb-4 w-full p-3 border-2 border-brand-100
                focus:border-brand-500 rounded-xl
                transition
              "
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              required
              autoComplete="email"
            />
            <button
              type="submit"
              className="
                btn btn-primary w-full text-lg flex items-center justify-center gap-2
                disabled:opacity-50
              "
              disabled={!resetEmail}
            >
              <KeyRound className="w-5 h-5" /> Send Reset Email
            </button>
            <button
              type="button"
              className="
                w-full mt-3 bg-gray-100 text-brand-700
                py-2 rounded-xl font-semibold flex items-center justify-center gap-2
                hover:bg-gray-200 transition
              "
              onClick={() => setResetMode(false)}
            >
              <ArrowLeft className="w-5 h-5" /> Back to Login
            </button>
            {resetSent && (
              <div className="text-green-600 mt-4 text-center font-semibold">
                Password reset email sent!
              </div>
            )}
            {resetError && (
              <div className="text-red-600 mt-4 text-center font-medium">
                {resetError}
              </div>
            )}
          </form>
        )}
      </main>

      <footer
        className="
          py-6 text-center text-xs text-gray-500
          bg-gradient-to-br from-brand-100 via-accent-50 to-white
          border-t border-brand-100 mt-10 w-full
        "
      >
        &copy; {new Date().getFullYear()} Cakeday HR Onboarding &amp; Recognition
      </footer>
    </div>
  );
}
