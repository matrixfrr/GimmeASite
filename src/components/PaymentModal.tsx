"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  X,
  CreditCard,
  Shield,
  Check,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Lock,
} from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: "one-time" | "monthly";
}

export function PaymentModal({ isOpen, onClose, planType }: PaymentModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string>("");

  // Email validation helper
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateEmail = (emailValue: string) => {
    if (!emailValue.trim()) {
      setEmailError("");
      return;
    }
    if (!isValidEmail(emailValue)) {
      setEmailError("Please enter a valid email address");
    } else {
      setEmailError("");
    }
  };

  const planDetails = {
    "one-time": {
      name: "Upfront",
      price: "$499",
      priceLabel: "upfront payment",
      features: [
        "Stunning, Fully Custom Design",
        "Blazing-Fast Load Speeds",
        "Flawless on Every Device",
        "Three Months of Dedicated Support",
        "Around-the-Clock Security Monitoring",
      ],
    },
    monthly: {
      name: "Monthly Plan",
      price: "$199",
      priceLabel: "per month",
      features: [
        "Everything in Upfront",
        "Priority Updates & Fresh Improvements",
        "Worry-Free Ongoing Maintenance",
        "Powerful Real-Time Analytics Dashboard",
      ],
    },
  };

  const plan = planDetails[planType];

  // Reset form state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setEmailError("");
      setAgreedToTerms(false);
      setError("");
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleProceedToCheckout = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      setError("Please fix the email address above");
      return;
    }
    if (!agreedToTerms) {
      setError("Please agree to the terms and conditions");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Verify email and plan type against the database
      const response = await fetch("/api/quotes/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), planType }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to verify email. Please try again.");
        setIsLoading(false);
        return;
      }

      // Check if quote was found
      if (!data.found) {
        // Show the appropriate error message
        setError(data.message || "This email address is not recognized.");
        setIsLoading(false);
        return;
      }

      // Email verified and plan matches - proceed to checkout
      window.location.href = `/checkout?email=${encodeURIComponent(email)}&plan=${planType}`;
    } catch (err) {
      setError("Something went wrong. Please try again or contact us at hello@gimmeasite.com.");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-card border border-border rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideIn">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-1">Proceed to Checkout</h3>
          <p className="text-muted-foreground">
            {plan.name}
          </p>
        </div>

        {/* Important Notice */}
        <div className="bg-red-500/15 border-2 border-red-500/50 rounded-xl p-4 mb-6 shadow-lg shadow-red-500/10">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h4 className="font-bold text-red-500 text-sm mb-2 uppercase tracking-wide">
                Important Notice
              </h4>
              <p className="text-sm font-bold text-red-500">
                Do not pay unless you have approved your site with one of our agents.
              </p>
            </div>
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Email Input */}
        <div className="space-y-4 mb-6">
          <div>
            <label
              htmlFor="payment-email"
              className="block text-sm font-medium mb-2"
            >
              Email Address <span className="text-red-500">*</span>
            </label>
            <Input
              id="payment-email"
              type="email"
              placeholder="john@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                if (emailError && isValidEmail(e.target.value)) {
                  setEmailError("");
                }
              }}
              onBlur={(e) => validateEmail(e.target.value)}
              className={`bg-background ${emailError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              required
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Use the same email address from your contact form submission.
            </p>
          </div>
        </div>

        {/* Terms Agreement */}
        <div className="mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => {
                setAgreedToTerms(e.target.checked);
                setError("");
              }}
              className="mt-1 w-4 h-4 rounded border-border accent-primary"
            />
            <span className="text-sm text-muted-foreground">
              I agree to the{" "}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  window.dispatchEvent(new Event("openTermsOfService"));
                }}
              >
                Terms of Service
              </button>
              {planType === "one-time" && (
                <>
                  {" "}
                  and understand that this transaction is{" "}
                  <span className="text-foreground font-semibold">
                    non-refundable
                  </span>
                </>
              )}
              {planType === "monthly" && (
                <>
                  {" "}
                  and understand that any future transactions from this plan, including the initial payment, are{" "}
                  <span className="text-foreground font-semibold">
                    non-refundable
                  </span>
                </>
              )}
              .
            </span>
          </label>
        </div>

        {/* Fine Print */}
        <div className="text-xs text-muted-foreground mb-6 space-y-1">
          <p>
            {planType === "one-time"
              ? "• Three (3) revisions are included (email support). Requesting extra revisions will incur additional fees."
              : "• Unlimited revisions are included (email support). Requesting large-scale updates may incur additional fees."}
          </p>
          <p>
            • By proceeding, you agree to our{" "}
            <button
              type="button"
              className="text-primary hover:underline"
              onClick={() =>
                window.dispatchEvent(new Event("openPrivacyPolicy"))
              }
            >
              Privacy Policy
            </button>
            .
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Checkout Button */}
        <Button
          onClick={handleProceedToCheckout}
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary/90 text-base sm:text-lg py-6"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin flex-shrink-0" />
              <span>Verifying...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="truncate">Secure Checkout</span>
              <ExternalLink className="w-4 h-4 ml-2 flex-shrink-0 hidden sm:block" />
            </>
          )}
        </Button>

        {/* Security Badge */}
        <div className="text-center mt-4">
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>256-bit SSL encrypted</span>
            <span>•</span>
            <span>Secure checkout</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
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
    </div>
  );
}
