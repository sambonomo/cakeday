"use client";

import React from "react";

type ToastProps = {
  message: string;
  type?: "success" | "error";
  onClose?: () => void;
};

export default function Toast({ message, type = "success", onClose }: ToastProps) {
  return (
    <div
      className={`fixed top-6 right-6 z-50 px-4 py-2 rounded shadow-lg transition-all
        ${type === "success" ? "bg-green-600 text-white" : "bg-red-600 text-white"}`}
      role="alert"
      onClick={onClose}
    >
      {message}
      {onClose && (
        <button className="ml-4 underline" onClick={onClose}>Close</button>
      )}
    </div>
  );
}
