"use client";

import React from "react";

interface KudosBadgeProps {
  emoji: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

const sizeMap = {
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
};

export default function KudosBadge({
  emoji,
  label,
  size = "md",
  className = "",
  showLabel = false,
}: KudosBadgeProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span
        className={sizeMap[size]}
        role="img"
        aria-label={label || "Badge"}
        title={label}
      >
        {emoji}
      </span>
      {showLabel && label && (
        <span className="text-xs sm:text-sm text-gray-600">{label}</span>
      )}
    </span>
  );
}
