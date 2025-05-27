import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { functions } from "../lib/firebase"; // adjust import as needed

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

export default function ActivateAccount() {
  const query = useQuery();
  const navigate = useNavigate();
  const inviteId = query.get("inviteId");
  const emailFromLink = query.get("email") || "";
  const [email, setEmail] = useState(emailFromLink);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"signup"|"done">("signup");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (emailFromLink) setEmail(emailFromLink);
  }, [emailFromLink]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const auth = getAuth();

    try {
      // 1. Create account (or log in if exists)
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } catch (err: any) {
        // If account exists, try login
        if (err.code === "auth/email-already-in-use") {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
        } else {
          throw err;
        }
      }
      const user = userCredential.user;

      // 2. Call Cloud Function to accept invite & merge profile
      const acceptInvite = httpsCallable(functions, "acceptInvite");
      await acceptInvite({ inviteId, email });

      setStep("done");
      setTimeout(() => {
        navigate("/dashboard"); // or your onboarding/checklist page
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
      <div className="flex flex-col items-center mt-12">
        <h2 className="text-xl font-bold mb-2">Welcome!</h2>
        <p>Your account is activated. Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto my-16 p-6 rounded shadow bg-white">
      <h1 className="text-2xl font-bold mb-4">Activate Your Account</h1>
      <p className="mb-4">Set your password to finish joining your team.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1">Email</label>
          <input
            type="email"
            required
            value={email}
            className="w-full p-2 border rounded"
            onChange={e => setEmail(e.target.value)}
            disabled={!!emailFromLink}
          />
        </div>
        <div>
          <label className="block font-medium mb-1">Password</label>
          <input
            type="password"
            required
            value={password}
            className="w-full p-2 border rounded"
            onChange={e => setPassword(e.target.value)}
            minLength={8}
          />
        </div>
        <button
          type="submit"
          className="bg-brand-600 text-white px-4 py-2 rounded w-full"
          disabled={loading}
        >
          {loading ? "Activating..." : "Activate Account"}
        </button>
        {error && (
          <div className="text-red-600 text-sm mt-2">{error}</div>
        )}
      </form>
    </div>
  );
}
