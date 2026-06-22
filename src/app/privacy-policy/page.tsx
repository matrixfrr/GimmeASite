"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PrivacyPolicyPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main page with privacy policy trigger
    router.replace("/?modal=privacy-policy");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}
