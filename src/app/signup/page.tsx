"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { nanoid } from "nanoid";

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

  const { signup } = useAuth();
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let companyId = "";
      let code = inviteCode.trim().toUpperCase();

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

        // Extract domain from email (e.g., 'user@acme.com' => 'acme.com')
        const domain = email.split("@")[1]?.toLowerCase().trim();
        if (!domain) {
          setError("Could not extract domain from email.");
          setLoading(false);
          return;
        }

        // Check if domain is already in use by another company
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

        // Prevent duplicate company names (optional)
        const existing = await getDocs(
          query(
            collection(db, "companies"),
            where("name", "==", companyName.trim())
          )
        );
        if (!existing.empty) {
          setError("A company with this name already exists.");
          setLoading(false);
          return;
        }

        // Generate unique invite code
        code = nanoid(8).toUpperCase();
        // Create the company doc with invite code and domain
        const companyRef = await addDoc(collection(db, "companies"), {
          name: companyName.trim(),
          domain,
          createdAt: new Date(),
          inviteCode: code,
        });
        companyId = companyRef.id;
        setGeneratedCode(code);
      } else {
        // Join by invite code
        if (!inviteCode.trim()) {
          setError("Please enter your company invite code.");
          setLoading(false);
          return;
        }
        // Lookup company by invite code
        const q = query(
          collection(db, "companies"),
          where("inviteCode", "==", code)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          setError("Invite code not found. Please check with your admin.");
          setLoading(false);
          return;
        }
        const companyDoc = snap.docs[0];
        companyId = companyDoc.id;
      }

      // Sign up user and add company/role info
      // Add status: "newHire" for join mode, leave undefined (or set "active") for admin
      await signup(email, password, {
        companyId,
        role: mode === "create" ? "admin" : "user",
        name,
        status: mode === "join" ? "newHire" : undefined,
      });

      if (mode === "create") {
        // Show invite code to admin after creating company
        setLoading(false);
        return; // Don't push to dashboard yet
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Signup failed");
      setLoading(false);
    }
  };

  // Show code after company creation for admin
  if (generatedCode) {
    return (
      <div
        className="
          flex flex-col items-center justify-center min-h-screen
          bg-gradient-to-br from-white via-brand-50 to-accent-50
          px-4
        "
      >
        <div
          className="
            backdrop-blur-lg bg-white/90 p-10 rounded-3xl
            shadow-2xl w-full max-w-md mt-8 flex flex-col items-center
          "
        >
          <h2 className="text-3xl font-extrabold mb-6 text-center text-brand-700">
            🎉 Company Created!
          </h2>
          <div className="mb-6 text-center">
            <p className="font-semibold mb-2">Your invite code:</p>
            <div
              className="
                text-2xl font-mono bg-gray-100 rounded-lg
                px-4 py-3 inline-block tracking-widest shadow
              "
            >
              {generatedCode}
            </div>
            <p className="mt-4 text-gray-700">
              Share this code with your teammates so they can join your company!
            </p>
          </div>
          <button
            className="
              w-full bg-brand-600 text-white py-3 rounded-xl font-bold shadow
              hover:bg-brand-700 transition-colors text-lg
            "
            onClick={() => router.push("/dashboard")}
          >
            Continue to Dashboard
          </button>
        </div>
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
      <form
        onSubmit={handleSignup}
        className="
          bg-white/95 p-10 rounded-3xl shadow-2xl
          w-full max-w-md mt-8 flex flex-col gap-6
          animate-fade-in
        "
      >
        <h2 className="text-3xl font-extrabold mb-3 text-center text-brand-700">
          Create an Account
        </h2>
        {error && (
          <div
            className="
              text-red-500 mb-2 text-center rounded px-4 py-2
              bg-red-100 font-semibold shadow
            "
          >
            {error}
          </div>
        )}

        {/* Company choice */}
        <div className="mb-2 flex gap-4 justify-center">
          <label
            className="
              flex items-center gap-1 text-sm font-semibold text-brand-700
              cursor-pointer
            "
          >
            <input
              type="radio"
              value="create"
              checked={mode === "create"}
              onChange={() => setMode("create")}
              className="accent-brand-600"
            />
            Create New Company
          </label>
          <label
            className="
              flex items-center gap-1 text-sm font-semibold text-accent-700
              cursor-pointer
            "
          >
            <input
              type="radio"
              value="join"
              checked={mode === "join"}
              onChange={() => setMode("join")}
              className="accent-accent-600"
            />
            Join Existing (with Invite Code)
          </label>
        </div>

        {mode === "create" ? (
          <>
            <input
              type="text"
              placeholder="Company Name"
              className="
                mb-3 w-full p-3 border-2 border-brand-200
                focus:border-brand-500 rounded-lg
              "
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              required
              maxLength={50}
            />
            <input
              type="text"
              placeholder="Your Name"
              className="
                mb-3 w-full p-3 border-2 border-brand-100
                focus:border-brand-400 rounded-lg
              "
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={40}
            />
          </>
        ) : (
          <>
            <input
              type="text"
              placeholder="Enter your company invite code"
              className="
                mb-3 w-full p-3 border-2 border-accent-200
                focus:border-accent-500 rounded-lg
              "
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              required
              maxLength={20}
            />
            <input
              type="text"
              placeholder="Your Name"
              className="
                mb-3 w-full p-3 border-2 border-accent-100
                focus:border-accent-400 rounded-lg
              "
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={40}
            />
          </>
        )}

        <input
          type="email"
          placeholder="Email"
          className="
            mb-3 w-full p-3 border-2 border-gray-200
            focus:border-brand-400 rounded-lg
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
            mb-3 w-full p-3 border-2 border-gray-200
            focus:border-brand-400 rounded-lg
          "
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="new-password"
        />

        <button
          type="submit"
          className="
            w-full bg-brand-600 text-white py-3
            rounded-xl font-bold shadow
            hover:bg-brand-700 transition-colors text-lg
            disabled:opacity-60
          "
          disabled={loading}
        >
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
