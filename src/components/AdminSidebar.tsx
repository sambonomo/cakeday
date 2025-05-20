"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const ADMIN_LINKS = [
  { label: "Onboarding Tasks", href: "/dashboard#admin-tasks", icon: "📋" },
  { label: "Manage Users", href: "/dashboard#admin-users", icon: "👥" },
  // Add more links as needed
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
    <aside className="fixed inset-0 z-50 flex">
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-40"
        onClick={onClose}
        aria-label="Close sidebar"
        tabIndex={-1}
      />
      {/* Sidebar panel */}
      <nav className="relative w-72 bg-white shadow-lg h-full flex flex-col p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-8">
          <span className="text-lg font-bold text-blue-700 flex items-center gap-2">
            <span>🛠️</span> Admin Panel
          </span>
          <button
            className="text-gray-500 hover:text-red-600 text-xl"
            aria-label="Close"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <ul className="flex-1 flex flex-col gap-2">
          {ADMIN_LINKS.map(link => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex items-center gap-2 px-4 py-3 rounded transition font-medium
                  ${pathname?.startsWith(link.href.replace("#", "")) ? "bg-blue-100 text-blue-700" : "hover:bg-gray-100"}
                `}
                onClick={onClose}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        {/* Add more controls here if needed */}
      </nav>
    </aside>
  );
}
