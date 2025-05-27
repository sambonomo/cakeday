"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db, auth } from "../../lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

export default function ActivatePageContent(): React.ReactElement {
  const router = useRouter();
  const search = useSearchParams();

  const emailParam = search.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEmail(emailParam);
  }, [emailParam]);

  useEffect(() => {
    if (passwordRef.current) passwordRef.current.focus();
  }, []);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!email) {
      setError("Invalid activation link: missing email.");
      setLoading(false);
      return;
    }

    try {
      // 1. Create the Firebase Auth user
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // 2. Update Firestore profile: set status to "active", remove disabled
      await updateDoc(doc(db, "users", cred.user.uid), {
        status: "active",
        disabled: false,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(
        err.message?.includes("email-already-in-use")
          ? "Your account is already activated. Please log in."
          : err.code === "auth/weak-password"
          ? "Password should be at least 8 characters."
          : err.message || "Activation failed. Please try again."
      );
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white via-brand-50 to-accent-50 px-4">
      <main className="w-full max-w-md bg-white/95 p-8 rounded-2xl shadow-xl mt-20 animate-fade-in">
        <h1 className="text-2xl font-bold text-brand-700 mb-4 text-center">
          Activate Your Account
        </h1>
        {success ? (
          <div className="text-green-600 text-center text-lg font-semibold" role="status">
            🎉 Your account is activated! Redirecting to login...
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleActivate} autoComplete="off">
            <p className="text-center mb-3 text-gray-700">
              Set a password to finish activating your Cakeday HR account.
            </p>
            <input
              type="email"
              value={email}
              className="p-3 border rounded-lg bg-gray-100"
              disabled
              aria-label="Activation email"
              required
            />
            <input
              ref={passwordRef}
              type="password"
              placeholder="Create a password"
              className="p-3 border rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoFocus
              autoComplete="new-password"
              aria-label="New password"
              disabled={loading}
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700 w-full"
              disabled={loading || password.length < 8}
              aria-disabled={loading || password.length < 8}
            >
              {loading ? "Activating..." : "Activate Account"}
            </button>
            {error && <div className="text-red-600 text-center" role="alert">{error}</div>}
          </form>
        )}
      </main>
    </div>
  );
}
