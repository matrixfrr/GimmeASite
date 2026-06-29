"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  X,
  CreditCard,
  Loader2,
  AlertTriangle,
  ExternalLink,
  Lock,
  ChevronDown,
} from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  planType: "one-time" | "monthly" | "hybrid";
  billingCycle?: "monthly" | "annual";
}

type PlanKey = "upfront" | "monthly" | "annual" | "hybrid";

const PLANS: { key: PlanKey; label: string }[] = [
  { key: "upfront", label: "Upfront" },
  { key: "monthly", label: "Monthly" },
  { key: "hybrid", label: "Hybrid" },
  { key: "annual", label: "Annual" },
];

function planKeyToVerifyType(key: PlanKey): string {
  if (key === "upfront") return "one-time";
  if (key === "annual") return "annual";
  if (key === "hybrid") return "hybrid";
  return "monthly";
}

function planKeyToCheckoutParam(key: PlanKey): string {
  if (key === "upfront") return "one-time";
  return key;
}

export function PaymentModal({ isOpen, onClose, planType, billingCycle = "monthly" }: PaymentModalProps) {
  const initKey: PlanKey =
    planType === "one-time" ? "upfront"
    : planType === "hybrid" ? "hybrid"
    : billingCycle === "annual" ? "annual"
    : "monthly";

  const [selectedPlan, setSelectedPlan] = useState<PlanKey>(initKey);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailError, setEmailError] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState<string>("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setEmail("");
      setEmailError("");
      setAgreedToTerms(false);
      setError("");
      setIsLoading(false);
      setDropdownOpen(false);
    } else {
      setSelectedPlan(initKey);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validateEmail = (v: string) => {
    if (!v.trim()) { setEmailError(""); return; }
    setEmailError(isValidEmail(v) ? "" : "Please enter a valid email address");
  };

  const planLabel = PLANS.find(p => p.key === selectedPlan)?.label ?? "Upfront";

  const handleProceedToCheckout = async () => {
    if (!email.trim()) { setError("Please enter your email address"); return; }
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address");
      setError("Please fix the email address above");
      return;
    }
    if (!agreedToTerms) { setError("Please agree to the terms and conditions"); return; }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/quotes/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.toLowerCase(), planType: planKeyToVerifyType(selectedPlan) }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to verify email. Please try again.");
        setIsLoading(false);
        return;
      }

      if (!data.found) {
        setError(data.message || "This email address is not recognized.");
        setIsLoading(false);
        return;
      }

      window.location.href = `/checkout?email=${encodeURIComponent(email)}&plan=${planKeyToCheckoutParam(selectedPlan)}`;
    } catch {
      setError("Something went wrong. Please try again or contact us at hello@gimmeasite.com.");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideIn">
        <button type="button" onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-1">Proceed to Checkout</h3>
          {/* Plan name with switcher */}
          <div className="flex items-center justify-center gap-1.5 relative" ref={dropdownRef}>
            <span className="text-muted-foreground">{planLabel}</span>
            <button
              type="button"
              onClick={() => setDropdownOpen(o => !o)}
              className="text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
              aria-label="Switch plan"
            >
              <ChevronDown className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden min-w-[140px]">
                {PLANS.map(plan => (
                  <button
                    key={plan.key}
                    type="button"
                    className={`w-full px-4 py-2 text-sm text-left hover:bg-primary/10 transition-colors flex items-center gap-1.5 ${selectedPlan === plan.key ? "text-primary font-medium" : "text-foreground"}`}
                    onClick={() => { setSelectedPlan(plan.key); setDropdownOpen(false); setError(""); }}
                  >
                    {plan.label}
                    {plan.key === "hybrid" && <span className="text-green-500 font-normal" style={{fontSize:"0.6rem"}}>Save 10%</span>}
                    {plan.key === "annual" && <span className="text-green-500 font-normal" style={{fontSize:"0.6rem"}}>Save 15%</span>}

                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <Separator className="mb-6" />

        {/* Email Input */}
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="payment-email" className="block text-sm font-medium mb-2">
              Email Address <span className="text-red-500 cursor-help" title="Required field">*</span>
            </label>
            <Input
              id="payment-email"
              type="email"
              placeholder="first@example.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
                if (emailError && isValidEmail(e.target.value)) setEmailError("");
              }}
              onBlur={(e) => validateEmail(e.target.value)}
              className={`bg-background ${emailError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
              required
            />
            {emailError && <p className="text-red-500 text-sm mt-1">{emailError}</p>}
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
              onChange={(e) => { setAgreedToTerms(e.target.checked); setError(""); }}
              className="mt-1 w-4 h-4 rounded border-border accent-primary"
            />
            <span className="text-sm text-muted-foreground">
              I agree to the{" "}
              <button type="button" className="text-primary hover:underline"
                onClick={(e) => { e.preventDefault(); window.dispatchEvent(new Event("openTermsOfService")); }}>
                Terms of Service
              </button>
              {" "}and{" "}
              <button type="button" className="text-primary hover:underline"
                onClick={(e) => { e.preventDefault(); window.dispatchEvent(new Event("openPrivacyPolicy")); }}>
                Privacy Policy
              </button>
              .
            </span>
          </label>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {/* Contact form tip */}
        <div className="flex items-start gap-2 bg-primary/8 border border-primary/20 rounded-lg px-3 py-2.5 mb-4 text-xs text-muted-foreground">
          <span className="text-primary font-bold mt-px flex-shrink-0">💡</span>
          <span>Make sure to fill out the{" "}<Link href="/#contact" onClick={onClose} className="text-primary font-semibold underline underline-offset-2 hover:text-primary/80 transition-colors">contact form</Link>{" "}before paying so we know what you need!</span>
        </div>
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
            <a href="mailto:hello@gimmeasite.com"
              className="text-orange-500 underline hover:text-orange-400 transition-colors">
              Contact us
            </a>{" "}
            and we'll send you a secure payment link.
          </p>
        </div>
      </div>
    </div>
  );
}
