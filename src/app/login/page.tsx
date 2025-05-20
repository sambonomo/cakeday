"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../lib/firebase";

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
      // router.push("/dashboard"); // Now handled by useEffect
    } catch (err: any) {
      const msg = err?.message || "Login failed";
      if (msg.includes("auth/wrong-password")) setError("Incorrect password.");
      else if (msg.includes("auth/user-not-found")) setError("No account found for that email.");
      else setError(msg);
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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      {!resetMode ? (
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-lg shadow-md w-full max-w-md mt-8"
        >
          <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
            Welcome Back
          </h2>
          {error && <div className="text-red-500 mb-4 text-center">{error}</div>}
          <input
            type="email"
            placeholder="Email"
            className="mb-4 w-full p-2 border border-gray-300 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            className="mb-4 w-full p-2 border border-gray-300 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            {loading ? "Logging In..." : "Log In"}
          </button>
          <div className="mt-4 flex flex-col items-center gap-2">
            <button
              type="button"
              className="text-blue-600 hover:underline text-sm"
              onClick={() => {
                setResetMode(true);
                setResetEmail("");
                setResetError(null);
                setResetSent(false);
              }}
            >
              Forgot password?
            </button>
            <p className="text-center text-sm">
              Don&apos;t have an account?{" "}
              <a href="/signup" className="text-blue-600 hover:underline">
                Sign Up
              </a>
            </p>
          </div>
        </form>
      ) : (
        <form
          onSubmit={handlePasswordReset}
          className="bg-white p-8 rounded-lg shadow-md w-full max-w-md mt-8"
        >
          <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
            Reset Password
          </h2>
          <p className="mb-4 text-center text-gray-700 text-sm">
            Enter your account email and we&apos;ll send you a password reset link.
          </p>
          <input
            type="email"
            placeholder="Your email"
            className="mb-4 w-full p-2 border border-gray-300 rounded"
            value={resetEmail}
            onChange={(e) => setResetEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
            disabled={!resetEmail}
          >
            Send Reset Email
          </button>
          <button
            type="button"
            className="w-full mt-3 bg-gray-200 text-blue-700 py-2 rounded hover:bg-gray-300 transition-colors"
            onClick={() => setResetMode(false)}
          >
            Back to Login
          </button>
          {resetSent && (
            <div className="text-green-600 mt-4 text-center">
              Password reset email sent!
            </div>
          )}
          {resetError && (
            <div className="text-red-600 mt-4 text-center">{resetError}</div>
          )}
        </form>
      )}
    </div>
  );
}
