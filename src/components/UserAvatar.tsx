"use client";

import React, { useState } from "react";

type UserAvatarProps = {
  nameOrEmail: string;
  photoURL?: string;
  size?: number; // px
  className?: string;
};

// (Optional) Color hash for consistent background colors
function stringToColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  const color = Math.floor(Math.abs(Math.sin(hash)) * 16777215).toString(16);
  return "#" + color.padStart(6, "0");
}

function getInitials(nameOrEmail: string) {
  if (!nameOrEmail) return "?";
  const parts = nameOrEmail.trim().split(" ");
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  if (nameOrEmail.includes("@")) return nameOrEmail[0].toUpperCase();
  return nameOrEmail.slice(0, 2).toUpperCase();
}

export default function UserAvatar({
  nameOrEmail,
  photoURL,
  size = 36,
  className = "",
}: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = getInitials(nameOrEmail);
  // Uncomment the next line to use unique bg colors:
  // const bgColor = stringToColor(nameOrEmail);

  if (photoURL && !imgError) {
    return (
      <img
        src={photoURL}
        alt={nameOrEmail}
        width={size}
        height={size}
        className={`rounded-full object-cover border border-gray-300 shadow-sm ${className}`}
        style={{ width: size, height: size, minWidth: size, minHeight: size }}
        onError={() => setImgError(true)}
        aria-label={nameOrEmail}
      />
    );
  }

  return (
    <span
      className={`
        rounded-full flex items-center justify-center 
        bg-gray-400 text-white font-bold border border-gray-300 shadow-sm ${className}
      `}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        fontSize: Math.round(size / 2),
        // backgroundColor: bgColor, // Uncomment to use color hash backgrounds
      }}
      aria-label={nameOrEmail}
      title={nameOrEmail}
    >
      {initials}
    </span>
  );
}
