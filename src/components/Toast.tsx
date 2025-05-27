"use client";

import React, { useEffect, useRef } from "react";

type ToastProps = {
  message: string;
  type?: "success" | "error";
  onClose?: () => void;
  durationMs?: number;
};

export default function Toast({
  message,
  type = "success",
  onClose,
  durationMs = 2500,
}: ToastProps) {
  const toastRef = useRef<HTMLDivElement | null>(null);

  // Auto-dismiss
  useEffect(() => {
    if (!onClose) return;
    const t = setTimeout(() => onClose(), durationMs);
    return () => clearTimeout(t);
  }, [onClose, durationMs]);

  // Focus on mount (for a11y)
  useEffect(() => {
    toastRef.current?.focus();
  }, []);

  // Allow Escape key to close
  useEffect(() => {
    if (!onClose) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      ref={toastRef}
      tabIndex={0}
      className={`
        fixed top-6 right-6 z-50 px-5 py-3 rounded-xl shadow-xl
        flex items-center gap-3
        transition-all duration-500 animate-fade-in-up
        ring-2 ring-opacity-25
        ${type === "success"
          ? "bg-green-600 text-white ring-green-300"
          : "bg-red-600 text-white ring-red-300"}
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      style={{ minWidth: 220, maxWidth: 350, outline: "none" }}
      onClick={onClose}
      title="Click to dismiss"
    >
      <span className="flex-1">{message}</span>
      {onClose && (
        <button
          className="ml-2 px-2 py-0.5 rounded bg-white/20 text-white font-semibold text-xs hover:bg-white/30 focus:outline-none transition"
          onClick={e => { e.stopPropagation(); onClose(); }}
          aria-label="Close notification"
        >
          Close
        </button>
      )}
    </div>
  );
}
