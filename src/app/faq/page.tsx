"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function FaqPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to main page with FAQ trigger
    router.replace("/?modal=faq");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}
