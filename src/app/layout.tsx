import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ClientProviders from "../components/ClientProviders"; // Handles Auth + Nav

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
  icons: [
    { rel: "icon", url: "/favicon.ico" },
    { rel: "apple-touch-icon", url: "/apple-touch-icon.png" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* SEO & Branding */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#1e293b" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        {/* Optional: More SEO/social meta tags can go here */}
      </head>
      <body
        className={`
          ${geistSans.variable} ${geistMono.variable}
          antialiased min-h-screen text-base
          bg-gradient-to-tr from-white via-brand-50 to-accent-50
          dark:from-slate-900 dark:via-indigo-950 dark:to-blue-900
        `}
        style={{
          fontFamily: "var(--font-geist-sans), Arial, Helvetica, sans-serif",
        }}
      >
        {/* Accessible skip link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only absolute left-4 top-4 z-50 bg-blue-700 text-white px-4 py-2 rounded transition"
        >
          Skip to main content
        </a>
        <ClientProviders>
          {/* pt-20 = nav height. Adjust if needed */}
          <main
            id="main-content"
            className="pt-20 flex flex-col min-h-screen transition-all duration-300"
            role="main"
            aria-label="Cakeday Main Content"
            tabIndex={-1}
          >
            {children}
          </main>
        </ClientProviders>
      </body>
    </html>
  );
}
