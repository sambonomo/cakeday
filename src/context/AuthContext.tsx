"use client";
// src/context/AuthContext.tsx
import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
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
  companyId: string | null;
  role: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (
    email: string,
    password: string,
    extra: { companyId: string; role: string }
  ) => Promise<UserCredential>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user || null);
      setLoading(true);

      // If logged in, fetch role and companyId from Firestore
      if (user) {
        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data() as any;
          setRole(data.role || "user");
          setCompanyId(data.companyId || null);
        } else {
          setRole("user");
          setCompanyId(null);
        }
      } else {
        setRole(null);
        setCompanyId(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sign up a new user with extra fields (companyId, role)
  const signup = async (
    email: string,
    password: string,
    extra: { companyId: string; role: string }
  ): Promise<UserCredential> => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    // Add Firestore user doc with extra fields
    await setDoc(doc(db, "users", userCred.user.uid), {
      email,
      companyId: extra.companyId,
      role: extra.role,
      createdAt: new Date(),
    });
    setRole(extra.role);
    setCompanyId(extra.companyId);
    return userCred;
  };

  // Log in user (role and companyId will be fetched by effect)
  const login = (email: string, password: string): Promise<UserCredential> =>
    signInWithEmailAndPassword(auth, email, password);

  // Log out
  const logout = (): Promise<void> => signOut(auth);

  return (
    <AuthContext.Provider value={{ user, companyId, role, loading, login, signup, logout }}>
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
