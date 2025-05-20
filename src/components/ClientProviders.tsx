"use client";

import { AuthProvider } from "../context/AuthContext";
import NavBar from "./NavBar";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <NavBar />
      {children}
    </AuthProvider>
  );
}
