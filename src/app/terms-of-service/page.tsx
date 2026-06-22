"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function TermsOfServicePage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main page with terms of service trigger
    router.replace("/?modal=terms-of-service");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}
