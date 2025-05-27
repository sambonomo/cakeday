// src/app/activate/page.tsx
import React, { Suspense } from "react";
import ActivatePageContent from "./ActivatePageContent";

// Dynamic route to prevent static rendering errors
export const dynamic = "force-dynamic";

export default function ActivatePage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center text-lg text-blue-700 animate-pulse"
          role="status"
          aria-label="Loading activation page"
        >
          Loading...
        </div>
      }
    >
      <ActivatePageContent />
    </Suspense>
  );
}
