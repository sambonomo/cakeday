"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../lib/firebase";

export default function ActivateAccount() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteId = searchParams.get("inviteId");
  const emailFromLink = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailFromLink);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"signup" | "done">("signup");
  const [error, setError] = useState<string | null>(null);

  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEmail(emailFromLink);
  }, [emailFromLink]);

  useEffect(() => {
    if (step === "signup" && passwordRef.current) {
      passwordRef.current.focus();
    }
  }, [step]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError(null);
    const auth = getAuth();

    if (!inviteId || !email) {
      setError("Invalid activation link. Please check your invite email or contact your admin.");
      setLoading(false);
      return;
    }

    try {
      // 1. Create account (or log in if exists)
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        if (err.code === "auth/email-already-in-use") {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        } else {
          throw err;
        }
      }
      // 2. Call Cloud Function to accept invite & merge profile
      const acceptInvite = httpsCallable(functions, "acceptInvite");
      await acceptInvite({ inviteId, email });

      setStep("done");
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (err: any) {
      setError(
        err?.message ||
        err?.code ||
        "Something went wrong. Please try again or contact your admin."
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === "done") {
    return (
      <div className="flex flex-col items-center mt-16">
        <h2 className="text-2xl font-bold mb-2 text-green-700">Welcome!</h2>
        <p className="text-lg text-gray-700">Your account is activated. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-16 p-6 rounded-xl shadow-lg bg-white border">
      <h1 className="text-2xl font-bold mb-4 text-brand-700">Activate Your Account</h1>
      <p className="mb-4 text-gray-700">Set your password to finish joining your team.</p>
      <form onSubmit={handleSubmit} className="space-y-5" autoComplete="off">
        <div>
          <label className="block font-medium mb-1" htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            required
            value={email}
            className="w-full p-2 border rounded bg-gray-50"
            onChange={e => setEmail(e.target.value)}
            disabled={!!emailFromLink || loading}
            autoComplete="email"
          />
        </div>
        <div>
          <label className="block font-medium mb-1" htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            required
            value={password}
            ref={passwordRef}
            className="w-full p-2 border rounded"
            onChange={e => setPassword(e.target.value)}
            minLength={8}
            autoComplete="new-password"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          className="bg-brand-600 text-white px-4 py-2 rounded w-full font-semibold shadow hover:bg-brand-700 transition disabled:opacity-60"
          disabled={loading || !email || !password || password.length < 8}
          aria-disabled={loading || !email || !password || password.length < 8}
        >
          {loading ? "Activating..." : "Activate Account"}
        </button>
        {error && (
          <div className="text-red-600 text-sm mt-2" role="alert">{error}</div>
        )}
      </form>
    </div>
  );
}
