import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css"; // Make sure this path is correct based on your structure
import { AuthProvider } from "../context/AuthContext"; // Make sure this path is correct

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Cakeday HR Onboarding & Recognition",
  description: "Build a thriving team! Modern onboarding, recognition, and celebration tools for SMBs.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 min-h-screen`}
      >
        {/* Provide global authentication context to all pages */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
