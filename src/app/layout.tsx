import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/AuthContext";
import NavBar from "../components/NavBar"; // 👈 New import

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
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        style={{
          background: "var(--color-background)",
          color: "var(--color-foreground)",
        }}
      >
        <AuthProvider>
          {/* Global NavBar (visible everywhere) */}
          <NavBar />
          <main className="pt-20">{children}</main>
          {/* pt-20 gives space for nav height, adjust as needed */}
        </AuthProvider>
      </body>
    </html>
  );
}
