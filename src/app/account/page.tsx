"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreditCard, TicketCheck, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function AccountPage() {
  useEffect(() => { document.title = "My Account | GimmeASite"; }, []);

  return (
    <main className="min-h-screen bg-background flex flex-col">
      <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2">
            <img src="/favicon.svg" alt="GimmeASite" className="w-8 h-8" />
            <span className="text-lg font-bold tracking-tight">GimmeASite</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold mb-2">My Account</h1>
            <p className="text-muted-foreground text-sm">
              Access your Billing Portal or open a support ticket.
            </p>
            <p className="text-xs text-muted-foreground/70 mt-2">
              <span className="font-medium text-foreground">Note:</span> An account is only created for you after your first payment is processed.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              className="flex flex-col items-center gap-2.5 p-5 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => { window.location.href = "https://gimmeasite.com/billing"; }}
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-center leading-tight">Billing Portal</span>
            </button>
            <button
              type="button"
              className="flex flex-col items-center gap-2.5 p-5 rounded-xl border border-border bg-background hover:border-primary/50 hover:bg-primary/5 transition-colors"
              onClick={() => { window.location.href = "https://gimmeasite.com/tickets"; }}
            >
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <TicketCheck className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm font-medium text-center leading-tight">Open a Ticket</span>
            </button>
          </div>

          <div className="text-center">
            <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
