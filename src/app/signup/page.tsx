"use client";
import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { db, auth } from "../../lib/firebase";
import { collection, addDoc, getDocs, query, where, setDoc, doc } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { nanoid } from "nanoid";
import {
  CheckCircle2,
  PartyPopper,
  Building2,
  UserPlus,
  ArrowRight,
  Copy,
} from "lucide-react";

export default function SignupPage(): React.ReactElement {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Company selection/creation
  const [mode, setMode] = useState<"create" | "join">("create");
  const [companyName, setCompanyName] = useState<string>("");
  const [inviteCode, setInviteCode] = useState<string>("");

  // After admin creates company, show code
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const codeRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  async function handleSignup(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let companyId = "";
      let code = inviteCode.trim().toUpperCase();

      // --- Create Company Flow ---
      if (mode === "create") {
        if (!companyName.trim()) {
          setError("Please enter a company name.");
          setLoading(false);
          return;
        }
        if (!name.trim()) {
          setError("Please enter your name.");
          setLoading(false);
          return;
        }
        if (!email.trim() || !email.includes("@")) {
          setError("Please enter a valid email.");
          setLoading(false);
          return;
        }
        if (password.length < 8) {
          setError("Password must be at least 8 characters.");
          setLoading(false);
          return;
        }

        // Create user in Firebase Auth
        const userCred = await createUserWithEmailAndPassword(auth, email, password);

        // Extract domain from email
        const domain = email.split("@")[1]?.toLowerCase().trim();
        if (!domain) {
          setError("Could not extract domain from email.");
          setLoading(false);
          return;
        }
        // Domain already used?
        const domainExists = await getDocs(
          query(collection(db, "companies"), where("domain", "==", domain))
        );
        if (!domainExists.empty) {
          setError(
            "A company with this email domain already exists. Please join that company or use a different email."
          );
          setLoading(false);
          return;
        }
        // Company name unique?
        const existing = await getDocs(
          query(collection(db, "companies"), where("name", "==", companyName.trim()))
        );
        if (!existing.empty) {
          setError("A company with this name already exists.");
          setLoading(false);
          return;
        }
        // Generate invite code, create company
        code = nanoid(8).toUpperCase();
        const companyRef = await addDoc(collection(db, "companies"), {
          name: companyName.trim(),
          domain,
          createdAt: new Date(),
          inviteCode: code,
        });
        companyId = companyRef.id;
        // Add admin user to Firestore
        await setDoc(doc(db, "users", userCred.user.uid), {
          email,
          companyId,
          role: "admin",
          fullName: name,
          createdAt: new Date(),
        });
        setGeneratedCode(code);
        setLoading(false);
        return;
      }

      // --- Join Existing Company Flow ---
      if (!inviteCode.trim()) {
        setError("Please enter your company invite code.");
        setLoading(false);
        return;
      }
      const codeQuery = query(collection(db, "companies"), where("inviteCode", "==", code));
      const snap = await getDocs(codeQuery);
      if (snap.empty) {
        setError("Invite code not found. Please check with your admin.");
        setLoading(false);
        return;
      }
      const companyDoc = snap.docs[0];
      companyId = companyDoc.id;

      if (!name.trim()) {
        setError("Please enter your name.");
        setLoading(false);
        return;
      }
      if (!email.trim() || !email.includes("@")) {
        setError("Please enter a valid email.");
        setLoading(false);
        return;
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.");
        setLoading(false);
        return;
      }

      // Create user with Firebase Auth
      const userCred = await createUserWithEmailAndPassword(auth, email, password);

      // Create Firestore user profile
      await setDoc(doc(db, "users", userCred.user.uid), {
        email,
        companyId,
        role: "user",
        fullName: name,
        status: "newHire",
        createdAt: new Date(),
      });

      // Auto-login
      await signInWithEmailAndPassword(auth, email, password);

      router.push("/dashboard");
      setLoading(false);

    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists. Try logging in.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Please use at least 8 characters.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError(err.message || "Signup failed");
      }
      setLoading(false);
    }
  }

  // --- Show Invite Code to Admin after Company Creation ---
  if (generatedCode) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white via-brand-50 to-accent-50 px-4">
        <div className="backdrop-blur-lg bg-white/90 p-10 rounded-3xl shadow-2xl w-full max-w-md mt-8 flex flex-col items-center">
          <h2 className="text-3xl font-extrabold mb-6 text-center text-brand-700 flex items-center gap-2">
            <PartyPopper className="w-8 h-8 text-accent-400" /> Company Created!
          </h2>
          <div className="mb-6 text-center">
            <p className="font-semibold mb-2 flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
              Your invite code:
            </p>
            <div
              ref={codeRef}
              className="text-2xl font-mono bg-gray-100 rounded-lg px-4 py-3 inline-block tracking-widest shadow cursor-pointer select-all"
              title="Click to copy code"
              tabIndex={0}
              onClick={() => {
                navigator.clipboard.writeText(generatedCode);
                setCopied(true);
                setTimeout(() => setCopied(false), 1200);
              }}
              onKeyDown={e => {
                if (e.key === "Enter" || e.key === " ") {
                  navigator.clipboard.writeText(generatedCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1200);
                }
              }}
              aria-label="Copy invite code"
              role="button"
            >
              {generatedCode}
              <Copy className="inline w-5 h-5 ml-2 text-gray-400" />
              {copied && <span className="ml-2 text-green-600 text-sm font-bold">Copied!</span>}
            </div>
            <p className="mt-4 text-gray-700">
              Share this code with your teammates so they can join your company.
            </p>
          </div>
          <button
            className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold shadow hover:bg-brand-700 transition-colors text-lg flex items-center justify-center gap-2"
            onClick={() => router.push("/dashboard")}
            aria-label="Continue to Dashboard"
            autoFocus
          >
            <ArrowRight className="w-5 h-5" />
            Continue to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // --- Signup Form ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-white via-brand-50 to-accent-50 px-4">
      <form
        onSubmit={handleSignup}
        className="bg-white/95 p-10 rounded-3xl shadow-2xl w-full max-w-md mt-8 flex flex-col gap-6 animate-fade-in"
        aria-label="Sign up for Cakeday"
        autoComplete="off"
      >
        <h2 className="text-3xl font-extrabold mb-3 text-center text-brand-700 flex items-center gap-2">
          <UserPlus className="w-8 h-8 text-brand-500" /> Create an Account
        </h2>
        {error && (
          <div
            className="text-red-500 mb-2 text-center rounded px-4 py-2 bg-red-100 font-semibold shadow"
            role="alert"
            aria-live="assertive"
          >
            {error}
          </div>
        )}

        {/* Company choice */}
        <div className="mb-2 flex gap-4 justify-center">
          <label className="flex items-center gap-1 text-sm font-semibold text-brand-700 cursor-pointer">
            <input
              type="radio"
              value="create"
              checked={mode === "create"}
              onChange={() => setMode("create")}
              className="accent-brand-600"
            />
            <Building2 className="w-5 h-5" /> Create New Company
          </label>
          <label className="flex items-center gap-1 text-sm font-semibold text-accent-700 cursor-pointer">
            <input
              type="radio"
              value="join"
              checked={mode === "join"}
              onChange={() => setMode("join")}
              className="accent-accent-600"
            />
            <CheckCircle2 className="w-5 h-5" /> Join Existing (with Invite Code)
          </label>
        </div>

        {mode === "create" ? (
          <>
            <input
              type="text"
              placeholder="Company Name"
              className="mb-3 w-full p-3 border-2 border-brand-200 focus:border-brand-500 rounded-lg"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              maxLength={50}
              aria-label="Company Name"
            />
            <input
              type="text"
              placeholder="Your Name"
              className="mb-3 w-full p-3 border-2 border-brand-100 focus:border-brand-400 rounded-lg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={40}
              aria-label="Your Name"
            />
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Enter your company invite code"
              className="mb-3 w-full p-3 border-2 border-accent-200 focus:border-accent-500 rounded-lg"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
              maxLength={20}
              aria-label="Invite Code"
            />
            <input
              type="text"
              placeholder="Your Name"
              className="mb-3 w-full p-3 border-2 border-accent-100 focus:border-accent-400 rounded-lg"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={40}
              aria-label="Your Name"
            />
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          className="mb-3 w-full p-3 border-2 border-gray-200 focus:border-brand-400 rounded-lg"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          aria-label="Email"
        />
        <input
          type="password"
          placeholder="Password (min 8 characters)"
          className="mb-3 w-full p-3 border-2 border-gray-200 focus:border-brand-400 rounded-lg"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
          minLength={8}
          aria-label="Password"
        />

        <button
          type="submit"
          className="w-full bg-brand-600 text-white py-3 rounded-xl font-bold shadow hover:bg-brand-700 transition-colors text-lg flex items-center justify-center gap-2 disabled:opacity-60"
          disabled={loading}
          aria-disabled={loading}
        >
          <UserPlus className="w-5 h-5" />
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
        <p className="mt-2 text-center text-sm">
          Already have an account?{" "}
          <a
            href="/login"
            className="text-brand-600 font-bold hover:underline"
          >
            Login
          </a>
        </p>
      </form>
    </div>
  );
}
