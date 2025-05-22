"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  // Example Lucide icons—adjust as you like!
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
} from "lucide-react";

// Example links array, now using Icon components from lucide-react
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

  if (!open) return null;

  return (
    <aside
      className="fixed inset-0 z-50 flex"
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-panel-title"
    >
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40"
        onClick={onClose}
        aria-label="Close sidebar"
        tabIndex={-1}
      />

      {/* Sidebar panel */}
      <nav
        aria-label="Admin sidebar"
        className="relative w-72 bg-white shadow-lg h-full flex flex-col p-6 animate-fade-in"
      >
        <div className="flex items-center justify-between mb-8">
          {/* Title with a Lucide Tool icon instead of an emoji */}
          <span
            id="admin-panel-title"
            className="text-lg font-bold text-blue-700 flex items-center gap-2"
          >
            <Wrench className="w-5 h-5" />
            Admin Panel
          </span>

          <button
            className="text-gray-500 hover:text-red-600 text-xl"
            aria-label="Close admin sidebar"
            onClick={onClose}
          >
            &times;
          </button>
        </div>

        <ul className="flex-1 flex flex-col gap-2">
          {ADMIN_LINKS.map(({ href, label, Icon }) => {
            const isActive = pathname?.startsWith(href);

            return (
              <li key={href}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 px-4 py-3 rounded transition font-medium ${
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={onClose}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}
