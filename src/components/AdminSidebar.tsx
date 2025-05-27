"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Wrench,
  ClipboardList,
  LogOut,
  Users,
  Gift,
  Ticket,
  BarChart,
  Building,
  FileText,
  PlugZap,
  X
} from "lucide-react";

const ADMIN_LINKS = [
  { label: "Onboarding Tasks", href: "/admin/onboarding", Icon: ClipboardList },
  { label: "Offboarding Tasks", href: "/admin/offboarding", Icon: LogOut },
  { label: "Manage Users", href: "/admin/users", Icon: Users },
  { label: "Rewards Catalog", href: "/admin/rewards", Icon: Gift },
  { label: "Redemption Requests", href: "/admin/redemptions", Icon: Ticket },
  { label: "Analytics", href: "/admin/analytics", Icon: BarChart },
  { label: "Company Settings", href: "/admin/company", Icon: Building },
  { label: "Documents", href: "/admin/documents", Icon: FileText },
  { label: "Integrations", href: "/admin/integrations", Icon: PlugZap },
];

export default function AdminSidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);

  // Trap focus inside sidebar and close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab") {
        // Focus trap: keep tab focus inside sidebar
        const focusableEls = navRef.current?.querySelectorAll<HTMLElement>(
          'a,button,[tabindex]:not([tabindex="-1"])'
        );
        if (!focusableEls || focusableEls.length === 0) return;
        const first = focusableEls[0];
        const last = focusableEls[focusableEls.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  // Focus the close button when opened
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) closeBtnRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <aside
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-panel-title"
    >
      {/* Overlay with fade and slide in */}
      <div
        className="fixed inset-0 bg-black/40 transition-opacity animate-fade-in"
        onClick={onClose}
        aria-label="Close sidebar"
        tabIndex={-1}
      />
      {/* Sidebar panel */}
      <nav
        ref={navRef}
        aria-label="Admin sidebar"
        className="relative w-80 max-w-full bg-white shadow-xl h-full flex flex-col p-6 animate-slide-in-right"
      >
        <div className="flex items-center justify-between mb-8">
          <span
            id="admin-panel-title"
            className="text-xl font-bold text-blue-700 flex items-center gap-2"
          >
            <Wrench className="w-6 h-6" />
            Admin Panel
          </span>
          <button
            className="rounded-full p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 focus:outline-none transition"
            aria-label="Close admin sidebar"
            onClick={onClose}
            ref={closeBtnRef}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <ul className="flex-1 flex flex-col gap-1">
          {ADMIN_LINKS.map(({ href, label, Icon }) => {
            const isActive = pathname?.startsWith(href);

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded min-h-12 text-base transition font-medium outline-none ring-blue-400 ring-offset-2 focus-visible:ring-2
                    ${
                      isActive
                        ? "bg-blue-100 text-blue-700 font-semibold shadow"
                        : "hover:bg-gray-100"
                    }`}
                  onClick={onClose}
                  tabIndex={0}
                  aria-current={isActive ? "page" : undefined}
                  aria-label={label}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="mt-8 border-t pt-6 text-xs text-gray-400 text-center select-none">
          &copy; {new Date().getFullYear()} Cakeday • Admin
        </div>
      </nav>
      <style jsx global>{`
        @keyframes slide-in-right {
          0% {
            transform: translateX(100%);
            opacity: 0.6;
          }
          100% {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s cubic-bezier(0.42, 0, 0.58, 1) both;
        }
      `}</style>
    </aside>
  );
}
