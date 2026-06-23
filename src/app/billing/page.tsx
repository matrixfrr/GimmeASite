"use client";

import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CreditCard,
  ArrowRight,
  Loader2,
  Receipt,
  Settings,
  FileText,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";

const STRIPE_BILLING_PORTAL_URL = "https://account.gimmeasite.com";

function BillingContent() {
  const handleAccessPortal = () => {
    window.location.href = STRIPE_BILLING_PORTAL_URL;
  };

  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/favicon.svg" alt="GimmeASite" className="w-9 h-9" />
            <span className="font-bold text-xl tracking-tight">
              GimmeASite
            </span>
          </Link>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Billing Portal</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg">
          <Card className="border-border/50 bg-card p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                Billing Portal
              </h1>
              <p className="text-muted-foreground">
                Manage your subscription, payment methods, and invoices
              </p>
            </div>

            {/* Features list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 border border-border/50">
                <Settings className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium text-center">Manage Subscription</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 border border-border/50">
                <CreditCard className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium text-center">Update Payment</span>
              </div>
              <div className="flex flex-col items-center gap-2 p-4 rounded-xl bg-secondary/50 border border-border/50">
                <FileText className="w-6 h-6 text-primary" />
                <span className="text-sm font-medium text-center">View Invoices</span>
              </div>
            </div>

            {/* Info box */}
            <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 mb-6">
              <p className="text-sm text-muted-foreground text-center">
                You'll be redirected to Stripe's secure billing portal where you can log in with the email address you used during checkout.
              </p>
            </div>

            {/* Direct link button */}
            <Button
              onClick={handleAccessPortal}
              className="w-full h-12 text-base font-semibold"
            >
              Access Billing Portal
              <ExternalLink className="w-5 h-5 ml-2" />
            </Button>
          </Card>

          {/* Help text */}
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>
              Need help?{" "}
              <a
                href="mailto:hello@gimmeasite.com"
                className="text-primary hover:underline font-medium"
              >
                Contact us at hello@gimmeasite.com
              </a>
            </p>
          </div>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2 text-sm">
              <Receipt className="w-4 h-4" />
              <span>View Receipts</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4" />
              <span>Powered by Stripe</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; 2026 GimmeASite. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <Link href="/#contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <BillingContent />
    </Suspense>
  );
}
