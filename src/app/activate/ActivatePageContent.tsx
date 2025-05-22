"use client";
import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "../../lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../lib/firebase";

export default function ActivatePageContent(): React.ReactElement {
  const router = useRouter();
  const search = useSearchParams();

  const emailParam = search.get("email") || "";
  const [email, setEmail] = useState(emailParam);
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Fetch user's name (optional) for a personal touch
  useEffect(() => {
    async function fetchUser() {
      if (!email) return;
      // Users are indexed by UID, so you'll need a lookup-by-email query in real code
      // For now, just display email
      setFullName(""); // Not used, but can be customized if needed
    }
    fetchUser();
  }, [email]);

  async function handleActivate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

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
          : err.message || "Activation failed. Please try again."
      );
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white via-brand-50 to-accent-50 px-4">
      <main className="w-full max-w-md bg-white/95 p-8 rounded-2xl shadow-xl mt-20 animate-fade-in">
        <h1 className="text-2xl font-bold text-brand-700 mb-4 text-center">Activate Your Account</h1>
        {success ? (
          <div className="text-green-600 text-center text-lg font-semibold">
            🎉 Your account is activated! Redirecting to login...
          </div>
        ) : (
          <form className="flex flex-col gap-4" onSubmit={handleActivate}>
            <p className="text-center mb-3 text-gray-700">
              Set a password to finish activating your Cakeday HR account.
            </p>
            <input
              type="email"
              value={email}
              className="p-3 border rounded-lg bg-gray-100"
              disabled
            />
            <input
              type="password"
              placeholder="Create a password"
              className="p-3 border rounded-lg"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoFocus
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-blue-700"
              disabled={loading}
            >
              {loading ? "Activating..." : "Activate Account"}
            </button>
            {error && <div className="text-red-600 text-center">{error}</div>}
          </form>
        )}
      </main>
    </div>
  );
}
