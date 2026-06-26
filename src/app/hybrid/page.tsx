"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function HybridPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/");
    setTimeout(() => {
      const el = document.getElementById("pricing");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 300);
  }, [router]);
  return null;
}
