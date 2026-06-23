"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Globe,
  CheckCircle2,
  PartyPopper,
  ArrowRight,
  Mail,
  Clock,
} from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function SuccessPage() {
  const [showConfetti, setShowConfetti] = useState(false);

  const fireConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#22c55e', '#16a34a', '#15803d', '#4ade80', '#86efac'],
    });

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors: ['#22c55e', '#16a34a', '#15803d', '#4ade80', '#86efac'],
      });
    }, 200);

    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors: ['#22c55e', '#16a34a', '#15803d', '#4ade80', '#86efac'],
      });
    }, 400);

    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.5 },
        colors: ['#22c55e', '#16a34a', '#15803d', '#4ade80', '#86efac', '#fbbf24', '#f59e0b'],
      });
    }, 600);
  }, []);

  useEffect(() => {
    setShowConfetti(true);
    const timer = setTimeout(() => {
      fireConfetti();
    }, 300);
    return () => clearTimeout(timer);
  }, [fireConfetti]);

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
          <Card className={`border-border/50 bg-card p-8 shadow-2xl overflow-hidden transition-all duration-500 ${showConfetti ? 'animate-in fade-in zoom-in-95' : ''}`}>
            {/* Success banner */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl py-3 px-6 mb-6">
              <div className="flex items-center justify-center gap-2 text-green-500">
                <CheckCircle2 className="w-5 h-5" />
                <span className="font-semibold">Payment Successful</span>
              </div>
            </div>

            <div className="text-center mb-6">
              <div className={`mx-auto mb-4 w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center transition-transform duration-700 ${showConfetti ? 'scale-100 animate-bounce' : 'scale-0'}`}>
                <PartyPopper className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                Thank You!
              </h1>
              <p className="text-muted-foreground">
                Your payment has been processed successfully.
              </p>
            </div>

            {/* What happens next */}
            <div className="space-y-4 p-5 rounded-xl bg-secondary/50 border border-border/50 mb-6">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                What happens next?
              </h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                    1
                  </span>
                  <span>
                    You&apos;ll receive a confirmation email with your receipt and order details.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                    2
                  </span>
                  <span>
                    Our team will reach out within 24 hours to discuss your project requirements.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-0.5">
                    3
                  </span>
                  <span>
                    We&apos;ll start working on your website and keep you updated throughout the process.
                  </span>
                </li>
              </ul>
            </div>

            {/* Google Review */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 mb-4">
              <span className="text-xl flex-shrink-0">⭐</span>
              <p className="text-sm">
                Enjoying GimmeASite? We&apos;d love a review!{" "}
                <a
                  href="https://g.page/r/CTaID4fouMzCEBI/review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-yellow-600 dark:text-yellow-400 hover:underline font-medium"
                >
                  Leave us a Google review
                </a>
              </p>
            </div>

            {/* Contact info */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/10 border border-primary/20 mb-6">
              <Mail className="w-5 h-5 text-primary flex-shrink-0" />
              <p className="text-sm">
                Questions? Contact us at{" "}
                <a
                  href="mailto:hello@gimmeasite.com"
                  className="text-primary hover:underline font-medium"
                >
                  hello@gimmeasite.com
                </a>
              </p>
            </div>

            {/* Celebrate again button */}
            <div className="flex gap-3 mb-4">
              <Button
                variant="outline"
                onClick={fireConfetti}
                className="flex-1 h-12 text-base"
              >
                <PartyPopper className="w-5 h-5 mr-2" />
                Celebrate Again
              </Button>
            </div>

            {/* CTA Button */}
            <Button asChild className="w-full h-12 text-base font-semibold mb-8">
              <Link href="/">
                Return to GimmeASite
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>

            {/* Personal closing message */}
            <div className="border-t border-border/50 pt-6 text-sm text-muted-foreground space-y-3 leading-relaxed">
              <p>
                If you&apos;re loving the experience, we&apos;d be so grateful if you shared us with a friend or family member who could use a website — or dropped us a quick review at{" "}
                <a
                  href="https://g.page/r/CTaID4fouMzCEBM/review"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  g.page/r/CTaID4fouMzCEBM/review
                </a>
                . You can also follow us on Instagram for new products and updates at{" "}
                <a
                  href="https://instagram.com/gimmeasite"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  @gimmeasite
                </a>
                . It means the world to us to serve you!
              </p>
              <p>
                Cheers,<br />
                <span className="font-medium text-foreground">The GimmeASite Team</span>
              </p>
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
