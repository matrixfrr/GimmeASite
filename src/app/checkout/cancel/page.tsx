"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Globe,
  XCircle,
  ArrowLeft,
  RefreshCw,
  Mail,
  HelpCircle,
} from "lucide-react";
import Link from "next/link";

export default function CancelPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight">
              GimmeASite
            </span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg">
          <Card className="border-border/50 bg-card p-8 shadow-2xl overflow-hidden">
            {/* Cancel banner */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl py-3 px-6 mb-6">
              <div className="flex items-center justify-center gap-2 text-amber-500">
                <XCircle className="w-5 h-5" />
                <span className="font-semibold">Payment Cancelled</span>
              </div>
            </div>

            <div className="text-center mb-6">
              <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center">
                <HelpCircle className="w-10 h-10 text-amber-500" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Changed Your Mind?
              </h1>
              <p className="text-muted-foreground">
                No worries! Your quote is still waiting for you.
              </p>
            </div>

            {/* Info box */}
            <div className="space-y-3 p-5 rounded-xl bg-secondary/50 border border-border/50 mb-6">
              <p className="text-sm text-muted-foreground">
                Your payment was cancelled and you have not been charged.
                If you experienced any issues during checkout or have questions
                about our services, we&apos;re here to help.
              </p>
            </div>

            {/* Contact info */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6">
              <Mail className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm">
                Need help? Contact us at{" "}
                <a
                  href="mailto:hello@gimmeasite.com"
                  className="text-primary hover:underline font-medium"
                >
                  hello@gimmeasite.com
                </a>
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button asChild className="w-full h-12 text-base font-semibold">
                <Link href="/checkout">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  Try Again
                </Link>
              </Button>

              <Button asChild variant="outline" className="w-full h-12 text-base font-semibold">
                <Link href="/">
                  <ArrowLeft className="w-5 h-5 mr-2" />
                  Return to GimmeASite
                </Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center text-sm text-muted-foreground">
          <p>&copy; 2026 GimmeASite. All rights reserved.</p>
        </div>
      </footer>
    </main>
  );
}
