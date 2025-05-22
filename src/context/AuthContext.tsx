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
  UserCredential,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

// ----- User profile type, now includes onboardingTemplateId and more -----
export type AuthUser = {
  uid: string;
  email: string;
  fullName?: string;
  phone?: string;
  birthday?: string;
  anniversary?: string;
  role?: string;
  photoURL?: string;
  disabled?: boolean;
  gender?: string;
  department?: string;
  status?: string; // "newHire" | "active" | "exiting"
  companyId?: string;
  onboardingTemplateId?: string; // <-- Added!
  // You can add: managerId, reportsTo, custom fields, etc.
};

// Type for the context value
interface AuthContextType {
  user: AuthUser | null;
  companyId: string | null;
  role: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (
    email: string,
    password: string,
    extra: Record<string, any>
  ) => Promise<UserCredential>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        // Always fetch Firestore profile fields (even if already in user obj)
        const userRef = doc(db, "users", firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        // Start with base Firebase info
        let mergedUser: AuthUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
        };

        if (userSnap.exists()) {
          const data = userSnap.data();
          mergedUser = {
            ...mergedUser,
            ...data, // All fields: onboardingTemplateId, status, gender, etc.
          };
          setRole(data.role || "user");
          setCompanyId(data.companyId || null);
        } else {
          setRole("user");
          setCompanyId(null);
        }

        setUser(mergedUser);
      } else {
        setUser(null);
        setRole(null);
        setCompanyId(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Sign up a new user with any extra profile fields (companyId, role, name, etc)
  const signup = async (
    email: string,
    password: string,
    extra: Record<string, any>
  ): Promise<UserCredential> => {
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    // Add Firestore user doc with extra fields
    await setDoc(doc(db, "users", userCred.user.uid), {
      email,
      ...extra, // includes companyId, role, onboardingTemplateId, etc.
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
