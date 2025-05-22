"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "./UserAvatar";
import AdminSidebar from "./AdminSidebar";

// --- Nav links: Adjust or add as needed ---
const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Directory", href: "/directory" },
  { label: "Events", href: "/events" },
  { label: "Rewards", href: "/rewards" }, // newly added link
];

export default function NavBar(): React.ReactElement | null {
  const { user, role, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // --- Notifications state ---
  const [notifCount, setNotifCount] = useState(0);

  // For closing the avatar dropdown when clicking outside
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Example: Fetch unread notifications count
  useEffect(() => {
    let unsub: (() => void) | null = null;
    async function loadNotifs() {
      if (user?.uid) {
        const { onSnapshot, collection, query, where } = await import("firebase/firestore");
        const { db } = await import("../lib/firebase");
        const q = query(
          collection(db, "notifications"),
          where("toUid", "==", user.uid),
          where("read", "==", false)
        );
        unsub = onSnapshot(q, (snap) => {
          setNotifCount(snap.size);
        });
      }
    }
    loadNotifs();
    return () => {
      if (unsub) unsub();
    };
  }, [user?.uid]);

  // Hide navbar if not authenticated or still loading
  if (!user || loading) return null;

  // Fallback for user name
  const nameOrEmail = user.fullName || user.email || "User";

  // Avatar + Dropdown (Profile/Logout)
  const avatarMenu = (
    <div className="relative" ref={dropdownRef}>
      <button
        className="flex items-center gap-2 focus:outline-none"
        onClick={() => setDropdownOpen((o) => !o)}
        aria-label="User menu"
        type="button"
      >
        <UserAvatar nameOrEmail={nameOrEmail} photoURL={user.photoURL} size={32} />
        <span className="hidden sm:block font-medium text-sm">{nameOrEmail}</span>
        <svg
          className={`w-4 h-4 ml-1 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {dropdownOpen && (
        <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow-lg z-50 animate-fade-in">
          <Link
            href="/profile"
            className="block px-4 py-2 text-gray-700 hover:bg-gray-100"
            onClick={() => setDropdownOpen(false)}
          >
            Profile
          </Link>
          <button
            onClick={() => {
              setDropdownOpen(false);
              logout();
            }}
            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100"
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow z-40">
      {/*
        1) Skip link for accessibility:
        - Appears when focused via keyboard (Tab)
        - Make sure your main content container has id="main-content"
      */}
      <a
        href="#main-content"
        className="
          sr-only
          focus:not-sr-only
          absolute
          left-4
          top-3
          bg-blue-700
          text-white
          px-4
          py-2
          rounded
          z-50
          transition
        "
      >
        Skip to Main Content
      </a>

      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Branding / Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-blue-700 text-lg"
          aria-label="Cakeday Home"
        >
          🎂 Cakeday
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex gap-6 items-center">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-blue-700 hover:underline font-medium text-sm"
            >
              {link.label}
            </Link>
          ))}

          {/* Notifications */}
          <Link
            href="/notifications"
            className="relative group ml-2 mr-1"
            aria-label="Notifications"
          >
            <span className="inline-block">
              <svg
                className="w-7 h-7 text-blue-600 hover:text-blue-800 transition"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405C18.37 15.203 18 14.552 18 13.867V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.64 5.36 6 7.929 6 11v2.867c0 .685-.37 1.336-.595 1.728L4 17h5m6 0v1a3 3 0 01-6 0v-1m6 0H9"
                />
              </svg>
              {notifCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow">
                  {notifCount > 9 ? "9+" : notifCount}
                </span>
              )}
            </span>
          </Link>

          {/* Admin button (Only if admin) */}
          {role === "admin" && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="text-pink-600 bg-pink-50 border border-pink-200 rounded px-3 py-1 font-semibold text-sm ml-2 hover:bg-pink-100 transition"
              type="button"
            >
              Admin
            </button>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden flex items-center p-2"
          onClick={() => setMenuOpen((m) => !m)}
          aria-label="Open navigation menu"
          type="button"
        >
          <svg className="w-7 h-7 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={
                menuOpen
                  ? "M6 18L18 6M6 6l12 12"
                  : "M4 8h16M4 16h16"
              }
            />
          </svg>
        </button>

        {/* User Avatar + Dropdown */}
        <div className="ml-3">{avatarMenu}</div>
      </div>

      {/* Mobile Menu (slide-down) */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t flex flex-col py-2 animate-fade-in">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="px-6 py-3 text-blue-700 font-medium hover:bg-gray-100"
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {/* Notifications (Mobile) */}
          <Link
            href="/notifications"
            className="flex items-center px-6 py-3 text-blue-700 font-medium hover:bg-gray-100 relative"
            onClick={() => setMenuOpen(false)}
          >
            <svg
              className="w-6 h-6 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 17h5l-1.405-1.405C18.37 15.203 18 14.552 18 13.867V11c0-3.07-1.64-5.64-4.5-6.32V4a1.5 1.5 0 00-3 0v.68C7.64 5.36 6 7.929 6 11v2.867c0 .685-.37 1.336-.595 1.728L4 17h5m6 0v1a3 3 0 01-6 0v-1m6 0H9"
              />
            </svg>
            Notifications
            {notifCount > 0 && (
              <span className="ml-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </Link>

          {/* Admin mode (Mobile) */}
          {role === "admin" && (
            <button
              onClick={() => {
                setMenuOpen(false);
                setSidebarOpen(true);
              }}
              className="px-6 py-3 text-pink-600 font-semibold hover:bg-gray-100 text-left w-full"
              type="button"
            >
              Admin
            </button>
          )}
        </div>
      )}

      {/* Admin Sidebar Drawer */}
      {role === "admin" && (
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
    </nav>
  );
}
