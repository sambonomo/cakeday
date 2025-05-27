"use client";

import React from "react";

interface KudosBadgeProps {
  Icon: React.ElementType; // Lucide icon component
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
  colorClass?: string; // Optional custom color
}

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
  colorClass = "text-green-600",
}: KudosBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-2
        ${className}
      `}
      aria-label={label || "Kudos badge"}
      title={label}
      tabIndex={0}
    >
      {Icon && (
        <Icon
          className={sizeMap[size] + ` ${colorClass} flex-shrink-0`}
          aria-hidden="true"
        />
      )}
      {showLabel && label && (
        <span className="text-xs sm:text-sm text-green-800 font-semibold">{label}</span>
      )}
    </span>
  );
}
