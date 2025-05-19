"use client";
// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  Dispatch,
  SetStateAction,
} from "react";
import { auth, db } from "../lib/firebase";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  User,
  UserCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

// Type for the context value
interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

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
  async function getUserRole(uid: string): Promise<string> {
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? (userSnap.data() as any).role || "user" : "user";
  }

  // Sign up a new user, then set their role in Firestore
  const signup = async (email: string, password: string): Promise<UserCredential> => {
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
  const login = (email: string, password: string): Promise<UserCredential> =>
    signInWithEmailAndPassword(auth, email, password);

  // Log out
  const logout = (): Promise<void> => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, role, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Helper hook
export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
