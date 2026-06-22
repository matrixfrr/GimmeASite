"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function ContactUsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main page contact section
    router.replace("/#contact");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}
