"use client";

import React from "react";

interface KudosBadgeProps {
  Icon: React.ElementType; // Lucide icon component
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

// Icon size mapping for consistency
const sizeMap = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-10 h-10",
};

export default function KudosBadge({
  Icon,
  label,
  size = "md",
  className = "",
  showLabel = false,
}: KudosBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Icon
        className={sizeMap[size] + " text-green-600 flex-shrink-0"}
        aria-label={label || "Badge"}
        title={label}
      />
      {showLabel && label && (
        <span className="text-xs sm:text-sm text-green-800 font-semibold">{label}</span>
      )}
    </span>
  );
}
