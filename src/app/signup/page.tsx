"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../context/AuthContext";
import { db } from "../../lib/firebase";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  DocumentData,
} from "firebase/firestore";

export default function SignupPage(): React.ReactElement {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Company selection/creation
  const [mode, setMode] = useState<"create" | "join">("create");
  const [companyName, setCompanyName] = useState<string>("");
  const [companies, setCompanies] = useState<DocumentData[]>([]);
  const [companyId, setCompanyId] = useState<string>("");

  const { signup } = useAuth();
  const router = useRouter();

  // Fetch existing companies for join option
  useEffect(() => {
    const fetchCompanies = async () => {
      const snapshot = await getDocs(collection(db, "companies"));
      setCompanies(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    };
    if (mode === "join") fetchCompanies();
  }, [mode]);

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let newCompanyId = companyId;

      // If creating a new company
      if (mode === "create") {
        if (!companyName.trim()) {
          setError("Please enter a company name.");
          setLoading(false);
          return;
        }

        // Prevent duplicate company names (optional, but nice)
        const existing = await getDocs(
          query(collection(db, "companies"), where("name", "==", companyName.trim()))
        );
        if (!existing.empty) {
          setError("A company with this name already exists.");
          setLoading(false);
          return;
        }

        // Create the company doc
        const companyRef = await addDoc(collection(db, "companies"), {
          name: companyName.trim(),
          createdAt: new Date(),
        });
        newCompanyId = companyRef.id;
      } else {
        if (!companyId) {
          setError("Please select your company.");
          setLoading(false);
          return;
        }
      }

      // Sign up user and add company/role info
      await signup(email, password, {
        companyId: newCompanyId,
        role: mode === "create" ? "admin" : "user",
      });
      router.push("/dashboard");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || "Signup failed");
      } else {
        setError("Signup failed");
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4">
      <form
        onSubmit={handleSignup}
        className="bg-white p-8 rounded-lg shadow-md w-full max-w-md mt-8"
      >
        <h2 className="text-2xl font-bold mb-6 text-center text-blue-700">
          Create an Account
        </h2>
        {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

        {/* Company choice */}
        <div className="mb-4 flex gap-4 justify-center">
          <label>
            <input
              type="radio"
              value="create"
              checked={mode === "create"}
              onChange={() => setMode("create")}
              className="mr-1"
            />
            Create New Company
          </label>
          <label>
            <input
              type="radio"
              value="join"
              checked={mode === "join"}
              onChange={() => setMode("join")}
              className="mr-1"
            />
            Join Existing
          </label>
        </div>

        {/* Company name or join dropdown */}
        {mode === "create" ? (
          <input
            type="text"
            placeholder="Company Name"
            className="mb-4 w-full p-2 border border-gray-300 rounded"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            required
          />
        ) : (
          <select
            className="mb-4 w-full p-2 border border-gray-300 rounded"
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            required
          >
            <option value="">Select Company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

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
          autoComplete="new-password"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition-colors"
          disabled={loading}
        >
          {loading ? "Signing Up..." : "Sign Up"}
        </button>
        <p className="mt-4 text-center">
          Already have an account?{" "}
          <a href="/login" className="text-blue-600 hover:underline">
            Login
          </a>
        </p>
      </form>
    </div>
  );
}
