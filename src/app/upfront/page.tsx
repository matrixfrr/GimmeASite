"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function UpfrontPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to home page with modal parameter
    router.replace("/?modal=payment-upfront");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to checkout...</p>
      </div>
    </div>
  );
}
