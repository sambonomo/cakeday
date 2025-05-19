"use client";
// src/context/AuthContext.js
import { createContext, useContext, useEffect, useState } from "react";
import { auth, db } from "../lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user || null);
      setLoading(true);

      // If logged in, fetch role from Firestore
      if (user) {
        const role = await getUserRole(user.uid);
        setRole(role);
      } else {
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Helper to get role from Firestore
  async function getUserRole(uid) {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data().role || "user" : "user";
  }

  // Sign up a new user, then set their role in Firestore
  const signup = async (email, password) => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    // Add Firestore user doc with default role "user"
    await setDoc(doc(db, "users", userCred.user.uid), {
      email,
      role: "user",
      createdAt: new Date(),
    });
    setRole("user");
    return userCred;
  };

  // Log in user (role will be fetched by effect)
  const login = (email, password) => signInWithEmailAndPassword(auth, email, password);

  // Log out
  const logout = () => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, role, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Helper hook
export function useAuth() {
  return useContext(AuthContext);
}
