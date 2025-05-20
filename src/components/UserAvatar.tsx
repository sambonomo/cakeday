"use client";

import React from "react";

type UserAvatarProps = {
  nameOrEmail: string;
  photoURL?: string;
  size?: number; // px
  className?: string;
};

function getInitials(nameOrEmail: string) {
  if (!nameOrEmail) return "?";
  const parts = nameOrEmail.split(" ");
  if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
  // fallback: try before '@' in email
  if (nameOrEmail.includes("@")) return nameOrEmail[0].toUpperCase();
  return nameOrEmail.slice(0, 2).toUpperCase();
}

export default function UserAvatar({
  nameOrEmail,
  photoURL,
  size = 36,
  className = "",
}: UserAvatarProps) {
  return photoURL ? (
    <img
      src={photoURL}
      alt={nameOrEmail}
      width={size}
      height={size}
      className={`rounded-full object-cover border border-gray-300 ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size }}
    />
  ) : (
    <span
      className={`rounded-full flex items-center justify-center bg-gray-300 text-white font-bold border border-gray-300 ${className}`}
      style={{ width: size, height: size, minWidth: size, minHeight: size, fontSize: size / 2 }}
      aria-label={nameOrEmail}
    >
      {getInitials(nameOrEmail)}
    </span>
  );
}
