"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "./UserAvatar";
import AdminSidebar from "./AdminSidebar";

const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Directory", href: "/directory" },
  { label: "Events", href: "/events" },
];

export default function NavBar(): React.ReactElement | null {
  const { user, role, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  // Only show navbar for authenticated users (but all hooks always run)
  if (!user || loading) return null;

  // Get user's name or fallback to email/"User"
  const nameOrEmail = user.fullName || user.email || "User";

  // User dropdown (profile + logout)
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
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3">
        {/* Branding */}
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-blue-700 text-lg">
          🎂 Cakeday
        </Link>
        {/* Desktop Links */}
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
          aria-label="Open navigation"
          type="button"
        >
          <svg className="w-7 h-7 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 8h16M4 16h16"} />
          </svg>
        </button>
        {/* User Avatar + Dropdown */}
        <div className="ml-3">{avatarMenu}</div>
      </div>
      {/* Mobile Menu */}
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
      {/* Admin Sidebar */}
      {role === "admin" && (
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
    </nav>
  );
}
