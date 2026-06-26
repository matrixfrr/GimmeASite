"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Lock,
  ShieldCheck,
} from "lucide-react";
import Link from "next/link";

interface Quote {
  id: string;
  name: string;
  email: string;
  priceCents: number;
  planType: string;
  notes?: string;
}

function CheckoutContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [planType, setPlanType] = useState<"one-time" | "monthly" | "bundle" | "annual">("one-time");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"email" | "confirm">("email");
  const hasAutoVerified = useRef(false);

  // Get plan type and email from URL if provided, and auto-verify if coming from PaymentModal
  useEffect(() => {
    const plan = searchParams.get("plan");
    const emailParam = searchParams.get("email");

    if (plan === "monthly" || plan === "one-time" || plan === "bundle" || plan === "annual") {
      setPlanType(plan as "one-time" | "monthly" | "bundle" | "annual");
    }
    if (emailParam) {
      setEmail(emailParam);
    }

    // Auto-verify if we have both email and plan from URL (coming from PaymentModal)
    // Only do this once per page load
    if (
      emailParam &&
      (plan === "monthly" || plan === "one-time" || plan === "bundle" || plan === "annual") &&
      !hasAutoVerified.current
    ) {
      hasAutoVerified.current = true;

      // Auto-verify inline to avoid function hoisting issues
      const doAutoVerify = async () => {
        setIsVerifying(true);
        setError(null);

        try {
          console.log("Auto-verifying email:", emailParam, "plan:", plan);
          const response = await fetch("/api/quotes/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: emailParam, planType: plan }),
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || "Failed to verify email");
          }

          if (!data.found) {
            setError(
              data.message ||
                "We couldn't find a quote for this email address. Please make sure you're using the same email you provided when requesting a quote, or contact us at hello@gimmeasite.com."
            );
            return;
          }

          console.log("Auto-verification successful, quote:", data.quote);
          setQuote(data.quote);
          setStep("confirm");
        } catch (err) {
          setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
          setIsVerifying(false);
        }
      };

      doAutoVerify();
    }
  }, [searchParams]);

  const verifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);
    setError(null);

    try {
      const response = await fetch("/api/quotes/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, planType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify email");
      }

      if (!data.found) {
        // Use the specific error message from the API
        setError(
          data.message ||
            "We couldn't find a quote for this email address. Please make sure you're using the same email you provided when requesting a quote, or contact us at hello@gimmeasite.com."
        );
        return;
      }

      setQuote(data.quote);
      setStep("confirm");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleGoBack = () => {
    setStep("email");
    setQuote(null);
    setError(null);
  };

  const handleCheckout = async () => {
    if (!quote) return;

    setIsProcessing(true);
    setError(null);

    // Set a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      setIsProcessing(false);
      setError("Request timed out. Please try again or contact support.");
    }, 30000);

    try {
      console.log("=== Starting checkout ===");
      console.log("Email:", email);
      console.log("Plan:", planType);
      console.log("Quote ID:", quote.id);

      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceType: planType,
          customerEmail: email,
          customerName: quote.name,
        }),
      });

      clearTimeout(timeoutId);

      const data = await response.json();

      console.log("Checkout API response:", {
        ok: response.ok,
        status: response.status,
        hasUrl: !!data.url,
        urlStart: data.url?.substring(0, 50),
      });

      if (!response.ok) {
        // Show debug info if available
        const errorMsg = data.error || "Failed to create checkout session";
        const debugInfo = data.debug ? ` (Debug: ${data.debug})` : "";
        throw new Error(errorMsg + debugInfo);
      }

      // Validate the URL before redirecting
      if (!data.url || typeof data.url !== "string") {
        console.error("No URL in response:", data);
        throw new Error("No checkout URL returned. Please try again or contact support.");
      }

      // CRITICAL: Validate that this is a Stripe Checkout URL, NOT a billing portal URL
      const url = data.url.trim();
      console.log("Received URL from API:", url.substring(0, 80));

      // Valid checkout URLs: custom domain or fallback Stripe domain
      const isValidCheckout = url.includes("account.gimmeasite.com/c/pay/") || url.includes("checkout.stripe.com/c/pay/");
      if (!isValidCheckout) {
        console.error("Invalid URL - not a Stripe checkout URL:", url);
        throw new Error(`Invalid checkout URL received. Please contact support at hello@gimmeasite.com.`);
      }

      // Reject billing portal URLs
      if (url.includes("/p/") || url.includes("billingportal")) {
        console.error("Received billing portal URL instead of checkout URL:", url);
        throw new Error("Received billing portal URL instead of checkout. Please contact support at hello@gimmeasite.com.");
      }

      console.log("=== Redirecting to Stripe Checkout ===");
      console.log("URL:", url.substring(0, 80) + "...");

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (err) {
      clearTimeout(timeoutId);
      console.error("Checkout error:", err);
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setIsProcessing(false);
    }
  };

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
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
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg">
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={step === "confirm" ? handleGoBack : undefined}
                className={`flex items-center gap-2 transition-colors ${step === "email" ? "text-primary" : "text-muted-foreground hover:text-foreground cursor-pointer"}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${step === "email" ? "bg-primary text-white" : step === "confirm" ? "bg-green-500 text-white" : "bg-muted text-muted-foreground"}`}>
                  {step === "confirm" ? <CheckCircle2 className="w-4 h-4" /> : "1"}
                </div>
                <span className="hidden sm:inline font-medium">Verify</span>
              </button>
              <div className="w-12 h-px bg-border" />
              <div className={`flex items-center gap-2 ${step === "confirm" ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${step === "confirm" ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                  2
                </div>
                <span className="hidden sm:inline font-medium">Pay</span>
              </div>
            </div>
          </div>

          {/* Double Verification Security Badge */}
          <div className="mb-4 flex items-center justify-center gap-2 py-2 px-4 rounded-full bg-green-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm font-medium w-fit mx-auto">
            <ShieldCheck className="w-4 h-4" />
            <span>Double Verification for Security</span>
          </div>

          <Card className="border-border/50 bg-card p-8 shadow-2xl">
            <div className="text-center mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
                {step === "email" ? "Secure Checkout" : "Confirm Order"}
              </h1>
              <p className="text-muted-foreground">
                {step === "email"
                  ? "Enter the email you used for your quote"
                  : "Review your order and proceed to payment"}
              </p>
            </div>

            {step === "email" ? (
              <form onSubmit={verifyEmail} className="space-y-6">
                {/* Security notice for step 1 */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400">
                  <ShieldCheck className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Why we verify your email</p>
                    <p className="text-muted-foreground">GimmeASite uses double verification to ensure your quote matches your account. This protects both you and us from unauthorized transactions.</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium">Email Address</label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Plan Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPlanType("one-time")}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        planType === "one-time"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-border/80"
                      }`}
                    >
                      <div className="font-semibold">Upfront</div>
                      <div className="text-sm text-muted-foreground">One-time payment</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanType("monthly")}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        planType === "monthly"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-border/80"
                      }`}
                    >
                      <div className="font-semibold">Monthly</div>
                      <div className="text-sm text-muted-foreground">Subscription</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanType("annual")}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        planType === "annual"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-border/80"
                      }`}
                    >
                      <div className="font-semibold">Annual</div>
                      <div className="text-sm text-muted-foreground">Yearly subscription</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPlanType("bundle")}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        planType === "bundle"
                          ? "border-primary bg-primary/10"
                          : "border-border hover:border-border/80"
                      }`}
                    >
                      <div className="font-semibold">Bundle</div>
                      <div className="text-xs text-muted-foreground">Upfront + Discounted Monthly</div>
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="text-sm space-y-1">
                      <p>{error}</p>
                      <p className="text-red-400 text-xs">
                        Need a hand? Email{" "}
                        <a href="mailto:hello@gimmeasite.com" className="underline hover:text-red-300">
                          hello@gimmeasite.com
                        </a>{" "}
                        and we&apos;ll send you a custom payment link.
                      </p>
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={isVerifying || !email}
                  className="w-full h-12 text-base font-semibold"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </>
                  )}
                </Button>
              </form>
            ) : quote ? (
              <div className="space-y-6">
                {/* Back button */}
                <button
                  type="button"
                  onClick={handleGoBack}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group font-semibold py-2 px-4 rounded-lg border border-border bg-background shadow-sm mb-2"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Back to verification
                </button>

                {/* Order Summary */}
                <div className="space-y-4 p-5 rounded-xl bg-secondary/50 border border-border/50">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <span className="text-sm text-green-500 font-medium">Quote verified</span>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Client</span>
                      <span className="font-medium">{quote.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Email</span>
                      <span className="font-medium">{quote.email}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Plan</span>
                      <span className="font-medium capitalize">{planType === "annual" ? "Annual" : planType === "monthly" ? "Monthly" : quote.notes?.includes("[monthly_cents:") ? "Bundle" : "Upfront"}</span>
                    </div>
                    {planType !== "annual" && quote.notes && quote.notes.replace(/\[monthly_cents:\d+\]\s*/g, "").trim() && (
                      <div className="pt-2">
                        <span className="text-sm text-muted-foreground">Notes</span>
                        <p className="text-sm mt-1">{quote.notes.replace(/\[monthly_cents:\d+\]\s*/g, "").trim()}</p>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <div className="text-right">
                      {(() => {
                        const monthlyMatch = quote.notes?.match(/\[monthly_cents:(\d+)\]/);
                        const monthlyCents = monthlyMatch ? parseInt(monthlyMatch[1]) : 0;
                        if (monthlyCents) {
                          return (
                            <div>
                              <div className="text-sm text-muted-foreground">{formatPrice(quote.priceCents)} upfront</div>
                              <div className="text-2xl font-bold text-primary">+ {formatPrice(monthlyCents)}<span className="text-sm text-muted-foreground">/mo</span></div>
                            </div>
                          );
                        }
                        return (
                          <>
                            <span className="text-2xl font-bold text-primary">
                              {formatPrice(quote.priceCents)}
                            </span>
                            {planType === "monthly" && (
                              <span className="text-sm text-muted-foreground">/month</span>
                            )}
                            {planType === "annual" && (
                              <span className="text-sm text-muted-foreground">/year</span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500">
                    <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                    <div className="text-sm space-y-1">
                      <p>{error}</p>
                      <p className="text-red-400 text-xs">
                        Need a hand? Email{" "}
                        <a href="mailto:hello@gimmeasite.com" className="underline hover:text-red-300">
                          hello@gimmeasite.com
                        </a>{" "}
                        and we&apos;ll send you a custom payment link.
                      </p>
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <Button
                    onClick={handleCheckout}
                    disabled={isProcessing}
                    className="w-full h-14 text-base font-semibold"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5 mr-2" />
                        Pay Now
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : null}
          </Card>

          {/* Trust badges */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="w-4 h-4" />
              <span>SSL Secured</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <CreditCard className="w-4 h-4" />
              <span>Powered by Stripe</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Lock className="w-4 h-4" />
              <span>256-bit Encryption</span>
            </div>
          </div>

          {/* Contact fallback */}
          <p className="text-xs text-muted-foreground mt-4 text-center">
            Not working?{" "}
            <a
              href="mailto:hello@gimmeasite.com"
              className="text-orange-500 underline hover:text-orange-400 transition-colors"
            >
              Contact us
            </a>{" "}
            and we'll send you a secure payment link.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; 2026 GimmeASite. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/#contact" className="hover:text-foreground transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <CheckoutContent />
    </Suspense>
  );
}
