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
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Optional: Favicon for all devices */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#1e293b" />
      </head>
      <body
        className={`
          ${geistSans.variable} ${geistMono.variable} antialiased min-h-screen
          bg-gradient-to-tr from-blue-50 via-rose-50 to-yellow-50
          dark:from-slate-900 dark:via-indigo-950 dark:to-blue-900
          text-base
        `}
        style={{
          background: "var(--color-background)",
          color: "var(--color-foreground)",
        }}
      >
        <ClientProviders>
          {/* pt-20 gives space for the navbar; adjust if your nav height changes */}
          <main
            className="pt-20 flex flex-col min-h-screen transition-all duration-300"
            role="main"
            aria-label="Cakeday Main Content"
          >
            {children}
          </main>
        </ClientProviders>
      </body>
    </html>
  );
}
