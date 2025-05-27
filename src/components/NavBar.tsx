"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu as HeadlessMenu, Transition } from "@headlessui/react";
import {
  Cake,
  Bell,
  Menu as MenuIcon,
  X as CloseIcon,
  User,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import UserAvatar from "./UserAvatar";
import AdminSidebar from "./AdminSidebar";

// Main nav links
const NAV_LINKS = [
  { label: "Dashboard", href: "/dashboard" },
  { label: "Directory", href: "/directory" },
  { label: "Events", href: "/events" },
  { label: "Rewards", href: "/rewards" },
];

export default function NavBar(): React.ReactElement | null {
  const { user, role, logout, loading } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const pathname = usePathname();
  const mobileMenuRef = useRef<HTMLDivElement | null>(null);

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

  // Close mobile menu with Escape
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [menuOpen]);

  // Close admin sidebar with Escape
  useEffect(() => {
    if (!sidebarOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSidebarOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [sidebarOpen]);

  // Click outside mobile menu to close
  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  if (!user || loading) return null;

  const nameOrEmail = user.fullName || user.email || "User";

  // Function to highlight active nav link
  const isActive = (href: string) => pathname === href;

  return (
    <nav className="fixed top-0 left-0 w-full bg-white shadow z-40">
      {/* Skip link for accessibility */}
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
        {/* Logo/Branding */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2 font-bold text-blue-700 text-lg select-none"
          aria-label="Cakeday Home"
        >
          <Cake className="w-7 h-7 text-pink-600" aria-hidden="true" />
          <span className="tracking-tight">Cakeday</span>
        </Link>

        {/* Desktop navigation */}
        <div className="hidden md:flex gap-6 items-center">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-blue-700 font-medium text-sm transition px-2 py-1 rounded 
                hover:underline hover:shadow
                ${isActive(link.href)
                  ? "underline bg-blue-50 shadow font-bold"
                  : ""}`}
              aria-current={isActive(link.href) ? "page" : undefined}
            >
              {link.label}
            </Link>
          ))}

          {/* Notifications */}
          <Link
            href="/notifications"
            className="relative ml-2 mr-1"
            aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} unread)` : ""}`}
          >
            <Bell className="w-6 h-6 text-blue-600 hover:text-blue-800 transition" />
            {notifCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow" aria-label={`${notifCount} unread notifications`}>
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </Link>

          {/* Admin button */}
          {role === "admin" && (
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1 text-pink-600 bg-pink-50 border border-pink-200 rounded px-3 py-1 font-semibold text-sm ml-2 hover:bg-pink-100 transition"
              type="button"
              aria-label="Open admin sidebar"
            >
              <Shield className="w-4 h-4" /> Admin
            </button>
          )}

          {/* User avatar & dropdown (Headless UI Menu) */}
          <HeadlessMenu as="div" className="relative ml-3">
            <HeadlessMenu.Button className="flex items-center gap-2 focus:outline-none rounded transition group">
              <UserAvatar nameOrEmail={nameOrEmail} photoURL={user.photoURL} size={32} />
              <span className="hidden sm:block font-medium text-sm">{nameOrEmail}</span>
            </HeadlessMenu.Button>
            <Transition
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-in"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <HeadlessMenu.Items className="absolute right-0 mt-2 w-44 bg-white border rounded shadow-lg z-50 focus:outline-none">
                <div className="py-1">
                  <HeadlessMenu.Item>
                    {({ active }) => (
                      <Link
                        href="/profile"
                        className={`flex items-center gap-2 px-4 py-2 text-gray-700 ${active ? "bg-gray-100" : ""}`}
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                    )}
                  </HeadlessMenu.Item>
                  <HeadlessMenu.Item>
                    {({ active }) => (
                      <button
                        onClick={logout}
                        className={`flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 ${active ? "bg-gray-100" : ""}`}
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    )}
                  </HeadlessMenu.Item>
                </div>
              </HeadlessMenu.Items>
            </Transition>
          </HeadlessMenu>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center p-2"
          onClick={() => setMenuOpen((m) => !m)}
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          type="button"
        >
          {menuOpen ? (
            <CloseIcon className="w-7 h-7 text-blue-700" />
          ) : (
            <MenuIcon className="w-7 h-7 text-blue-700" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          ref={mobileMenuRef}
          className="md:hidden bg-white border-t flex flex-col py-2 animate-fade-in absolute w-full left-0 top-full z-30"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`px-6 py-3 text-blue-700 font-medium hover:bg-gray-100 rounded
                ${isActive(link.href) ? "bg-blue-50 underline font-bold" : ""}`}
              aria-current={isActive(link.href) ? "page" : undefined}
              onClick={() => setMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}

          {/* Notifications (Mobile) */}
          <Link
            href="/notifications"
            className="flex items-center px-6 py-3 text-blue-700 font-medium hover:bg-gray-100 relative"
            aria-label={`Notifications${notifCount > 0 ? ` (${notifCount} unread)` : ""}`}
            onClick={() => setMenuOpen(false)}
          >
            <Bell className="w-5 h-5 mr-2" />
            Notifications
            {notifCount > 0 && (
              <span className="ml-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow" aria-label={`${notifCount} unread notifications`}>
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
              className="flex items-center gap-2 px-6 py-3 text-pink-600 font-semibold hover:bg-gray-100 text-left w-full"
              type="button"
              aria-label="Open admin sidebar"
            >
              <Shield className="w-4 h-4" /> Admin
            </button>
          )}

          {/* User avatar & dropdown (Headless UI) */}
          <HeadlessMenu as="div" className="relative px-6 py-2">
            <HeadlessMenu.Button className="flex items-center gap-2 focus:outline-none rounded transition group w-full">
              <UserAvatar nameOrEmail={nameOrEmail} photoURL={user.photoURL} size={28} />
              <span className="font-medium text-sm">{nameOrEmail}</span>
            </HeadlessMenu.Button>
            <Transition
              enter="transition duration-100 ease-out"
              enterFrom="transform scale-95 opacity-0"
              enterTo="transform scale-100 opacity-100"
              leave="transition duration-75 ease-in"
              leaveFrom="transform scale-100 opacity-100"
              leaveTo="transform scale-95 opacity-0"
            >
              <HeadlessMenu.Items className="absolute right-0 mt-2 w-44 bg-white border rounded shadow-lg z-50 focus:outline-none">
                <div className="py-1">
                  <HeadlessMenu.Item>
                    {({ active }) => (
                      <Link
                        href="/profile"
                        className={`flex items-center gap-2 px-4 py-2 text-gray-700 ${active ? "bg-gray-100" : ""}`}
                        onClick={() => setMenuOpen(false)}
                      >
                        <User className="w-4 h-4" />
                        Profile
                      </Link>
                    )}
                  </HeadlessMenu.Item>
                  <HeadlessMenu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          logout();
                        }}
                        className={`flex items-center gap-2 w-full text-left px-4 py-2 text-gray-700 ${active ? "bg-gray-100" : ""}`}
                      >
                        <LogOut className="w-4 h-4" />
                        Log Out
                      </button>
                    )}
                  </HeadlessMenu.Item>
                </div>
              </HeadlessMenu.Items>
            </Transition>
          </HeadlessMenu>
        </div>
      )}

      {/* Admin Sidebar Drawer */}
      {role === "admin" && (
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}
    </nav>
  );
}
