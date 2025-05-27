"use client";

import React, { ReactNode } from "react";
import { AuthProvider } from "../context/AuthContext";
import NavBar from "./NavBar";

// (Optional: add ThemeProvider, ToastProvider, etc. here for future scalability)

interface ClientProvidersProps {
  children: ReactNode;
}

/**
 * Wraps all client-side context/providers and the NavBar.
 * You can add theme, toast, analytics, or other global providers here.
 */
const ClientProviders: React.FC<ClientProvidersProps> = ({ children }) => {
  return (
    <AuthProvider>
      {/* Global navigation bar */}
      <NavBar />
      {/* Other providers/components (e.g., ThemeProvider, ToastProvider) go here */}
      {children}
    </AuthProvider>
  );
};

export default ClientProviders;
