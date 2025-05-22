// src/app/activate/page.tsx
import React, { Suspense } from "react";
import ActivatePageContent from "./ActivatePageContent";

// Dynamic route to prevent static rendering errors
export const dynamic = "force-dynamic";

export default function ActivatePage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <ActivatePageContent />
    </Suspense>
  );
}
