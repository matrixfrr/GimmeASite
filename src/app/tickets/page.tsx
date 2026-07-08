"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, AlertCircle, Paperclip, X, TicketCheck, Info, Search, Check } from "lucide-react";
import Link from "next/link";

const TICKET_TYPES = [
  { value: "revision", label: "Revision Request" },
  { value: "redesign", label: "Redesign Request" },
  { value: "extra_revisions", label: "Revision Refill" },
  { value: "domain_change", label: "Domain Change" },
  { value: "bug", label: "Bug Report" },
  { value: "inquiry", label: "General Inquiry" },
  { value: "upfront_renewal", label: "Upfront Support Renewal" },
  { value: "transfer_ownership", label: "Transfer of Ownership" },
  { value: "upgrade_to_subscription", label: "Upgrade to a Subscription Plan" },
  { value: "upgrade_plan", label: "Upgrade Plan" },
  { value: "downgrade_plan", label: "Downgrade Plan" },
  { value: "cancellation", label: "Cancellation" },
  { value: "other", label: "Other" },
];

const SUBJECT_PLACEHOLDERS: Record<string, string> = {
  revision: "Brief description of the edits needed",
  redesign: "Brief description of the redesign scope",
  extra_revisions: "How many extra revisions would you like? (1–10)",
  bug: "Brief description of the issue",
  inquiry: "Brief description of your question",
  upfront_renewal: "Brief description of your renewal request",
  other: "Brief description of your request",
};


interface RevisionCheck {
  allowed: boolean;
  used: number;
  limit: number | null;
  period: "total" | "monthly";
  plan?: string;
}

function validateDomain(d: string) {
  return /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i.test(d.trim());
}

export default function TicketsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [ticketType, setTicketType] = useState("");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [attachmentErrors, setAttachmentErrors] = useState<string[]>([]);
  const [planChangeTarget, setPlanChangeTarget] = useState("");
  const [showPlanChangeDropdown, setShowPlanChangeDropdown] = useState(false);
  const [planChangeConfirmed, setPlanChangeConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [revisionCheck, setRevisionCheck] = useState<RevisionCheck | null>(null);
  const [revisionChecking, setRevisionChecking] = useState(false);
  const [transferDomain, setTransferDomain] = useState(false);
  const [transferFiles, setTransferFiles] = useState(false);
  const [transferConfirmed, setTransferConfirmed] = useState(false);
  const [domainChangeQuery, setDomainChangeQuery] = useState("");
  const [domainChangeAvailability, setDomainChangeAvailability] = useState<"available" | "unavailable" | null>(null);
  const [domainChangeChecking, setDomainChangeChecking] = useState(false);
  const [domainChangeConfirmed, setDomainChangeConfirmed] = useState(false);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailVerified, setEmailVerified] = useState<"valid" | "invalid" | null>(null);
  const [clientPlan, setClientPlan] = useState<string | null>(null);
  const [billingDate, setBillingDate] = useState<string | null>(null);
  const [revisionCredits, setRevisionCredits] = useState<number>(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const isCancellation = ticketType === "cancellation";
  const isTransfer = ticketType === "transfer_ownership";
  const isDomainChange = ticketType === "domain_change";
  const isExtraRevisions = ticketType === "extra_revisions";
  const isRedesign = ticketType === "redesign";
  const isUpfrontRenewal = ticketType === "upfront_renewal";
  const isRevision = ticketType === "revision";
  const isUpgradeToSubscription = ticketType === "upgrade_to_subscription";
  const isUpgradePlan = ticketType === "upgrade_plan";
  const isDowngradePlan = ticketType === "downgrade_plan";
  const isPlanChange = isUpgradeToSubscription || isUpgradePlan || isDowngradePlan;
  const selectedLabel = TICKET_TYPES.find((t) => t.value === ticketType)?.label || "";

  const emailFormatValid = /^[^@]+@[^@]+\.[^@]+$/.test(email);
  const isTestEmail1 = !!process.env.NEXT_PUBLIC_TEST_EMAIL && email.toLowerCase() === process.env.NEXT_PUBLIC_TEST_EMAIL.toLowerCase();
  const isTestEmail2 = !!process.env.NEXT_PUBLIC_TEST_EMAIL_2 && email.toLowerCase() === process.env.NEXT_PUBLIC_TEST_EMAIL_2.toLowerCase();
  const isTestEmail = isTestEmail1 || isTestEmail2;
  const emailReady = emailVerified === "valid" || isTestEmail;
  // For test emails derive plan immediately rather than waiting for async fetch
  const effectivePlan = isTestEmail1 ? "annual" : isTestEmail2 ? "one-time" : clientPlan;

  // One-time plan users lose ticket access (except renewal) 6 months after billing date
  const supportExpired = (() => {
    if (effectivePlan !== "one-time" || !billingDate) return false;
    if (revisionCredits > 0) return false; // renewed
    const billed = new Date(billingDate);
    const expiry = new Date(billed);
    expiry.setMonth(expiry.getMonth() + 6);
    return new Date() >= expiry;
  })();

  const availableTicketTypes = supportExpired
    ? TICKET_TYPES.filter((tt) => tt.value === "upfront_renewal")
    : TICKET_TYPES.filter((tt) => {
        if (tt.value === "cancellation" && effectivePlan === "one-time") return false;
        if (tt.value === "extra_revisions" && effectivePlan === "annual") return false;
        if (tt.value === "upfront_renewal" && effectivePlan !== "one-time") return false;
        // Upgrade to subscription: only for Upfront (one-time) users
        if (tt.value === "upgrade_to_subscription" && effectivePlan !== "one-time") return false;
        // Upgrade Plan: Monthly can upgrade to Hybrid or Annual; Hybrid can upgrade to Annual
        if (tt.value === "upgrade_plan" && effectivePlan !== "monthly" && effectivePlan !== "hybrid") return false;
        // Downgrade Plan: Annual can downgrade to Hybrid or Monthly; Hybrid can downgrade to Monthly
        if (tt.value === "downgrade_plan" && effectivePlan !== "annual" && effectivePlan !== "hybrid") return false;
        return true;
      });

  const showSubject = !isCancellation && !isTransfer && !isDomainChange && !isPlanChange;

  useEffect(() => {
    if (!isRevision || !email || !/^[^@]+@[^@]+\.[^@]+$/.test(email)) {
      setRevisionCheck(null);
      return;
    }
    let cancelled = false;
    setRevisionChecking(true);
    fetch(`/api/tickets?checkRevisions=${encodeURIComponent(email)}`)
      .then((r) => r.json())
      .then((data) => { if (!cancelled) setRevisionCheck(data); })
      .catch(() => { if (!cancelled) setRevisionCheck(null); })
      .finally(() => { if (!cancelled) setRevisionChecking(false); });
    return () => { cancelled = true; };
  }, [isRevision, email]);

  // Debounced email verification against paid quotes
  useEffect(() => {
    setEmailVerified(null);
    if (!emailFormatValid) return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      setEmailChecking(true);
      try {
        const res = await fetch(`/api/tickets?checkRevisions=${encodeURIComponent(email)}`);
        if (!cancelled) {
          if (res.ok) {
            const d = await res.json();
            if (!cancelled) {
              setClientPlan(d.plan ?? null);
              setBillingDate(d.billingDate ?? null);
              setRevisionCredits(d.revisionCredits ?? 0);
              setEmailVerified("valid");
            }
          } else {
            setClientPlan(null);
            setBillingDate(null);
            setRevisionCredits(0);
            setEmailVerified("invalid");
          }
        }
      } catch {
        if (!cancelled) setEmailVerified(null);
      } finally {
        if (!cancelled) setEmailChecking(false);
      }
    }, 600);
    return () => { cancelled = true; clearTimeout(timer); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email]);

  const checkDomainChange = async (domain: string) => {
    if (!validateDomain(domain)) { setDomainChangeAvailability(null); return; }
    setDomainChangeChecking(true);
    setDomainChangeAvailability(null);
    try {
      const res = await fetch(`https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`);
      if (res.ok) {
        const data = await res.json();
        setDomainChangeAvailability(data.Answer && data.Answer.length > 0 ? "unavailable" : "available");
      }
    } catch { /* silent */ } finally {
      setDomainChangeChecking(false);
    }
  };

  useEffect(() => {
    if (submitted) document.title = "Ticket Submitted!";
    else document.title = "Open a Ticket";
  }, [submitted]);

  useEffect(() => {
    const hasData = !!(clientName || email || subject || description || ticketType);
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    if (hasData && !submitted) { window.addEventListener("beforeunload", handler); return () => window.removeEventListener("beforeunload", handler); }
  }, [clientName, email, subject, description, ticketType, submitted]);

  const resetTypeState = () => {
    setSubject("");
    setDescription("");
    setError("");
    setRevisionCheck(null);
    setTransferDomain(false);
    setTransferFiles(false);
    setTransferConfirmed(false);
    setDomainChangeQuery("");
    setDomainChangeAvailability(null);
    setDomainChangeConfirmed(false);
    setDomainChangeChecking(false);
    setPlanChangeTarget("");
    setShowPlanChangeDropdown(false);
    setPlanChangeConfirmed(false);
  };

  const handleTypeSelect = (value: string) => {
    setTicketType(value);
    setShowTypeDropdown(false);
    resetTypeState();
  };

  const clearTypeSelection = () => {
    setTicketType("");
    setShowTypeDropdown(false);
    resetTypeState();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketType) { setError("Please select a ticket type."); return; }
    if (isPlanChange && !planChangeTarget) { setError("Please select a target Plan."); return; }
    if ((isUpgradePlan || isDowngradePlan) && !planChangeConfirmed) { setError("Please confirm that you understand the billing terms before submitting."); return; }
    if (isTransfer && !transferDomain && !transferFiles) {
      setError("Please select at least one option for what you would like transferred.");
      return;
    }
    if (isTransfer && !transferConfirmed) {
      setError("Please confirm that you understand this action is irreversible before submitting.");
      return;
    }
    if (isDomainChange && !domainChangeConfirmed) {
      setError("Please confirm that you understand this action is irreversible before submitting.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("email", email);
      fd.append("ticket_type", ticketType);
      if (isTransfer) {
        fd.append("transfer_domain", String(transferDomain));
        fd.append("transfer_files", String(transferFiles));
        fd.append("subject", [transferDomain && "Domain", transferFiles && "Website Files"].filter(Boolean).join(" + "));
      } else if (isDomainChange) {
        fd.append("subject", domainChangeQuery || "Domain change request");
      } else if (isPlanChange) {
        fd.append("subject", `${selectedLabel} → ${planChangeTarget}`);
      } else {
        fd.append("subject", subject);
      }
      fd.append("description", description);
      if (isPlanChange && planChangeTarget) fd.append("plan_change_target", planChangeTarget);
      attachments.forEach(f => fd.append("attachment", f));

      const res = await fetch("/api/tickets", { method: "POST", body: fd });
      const data = await res.json();

      if (res.status === 404) { setError("__contact_error__"); setLoading(false); return; }
      if (!res.ok) { setError(data.error || "Failed to submit ticket."); setLoading(false); return; }

      setClientName(data.name || "");
      setAttachments([]);
      setAttachmentErrors([]);
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const revisionLimitReached = isRevision && revisionCheck && !revisionCheck.allowed;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/favicon.svg" alt="GimmeASite" className="w-9 h-9" />
            <span className="font-bold text-xl tracking-tight">GimmeASite</span>
          </Link>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-lg">
          {submitted ? (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold mb-3">Ticket Submitted!</h1>
              <p className="text-muted-foreground mb-2">
                {clientName ? `Thanks, ${clientName}.` : "Thanks!"} We&apos;ve received your ticket and will get back to you shortly.
              </p>
              <p className="text-sm text-muted-foreground">
                Questions? Reach us at{" "}
                <a href="mailto:hello@gimmeasite.com" className="text-primary">hello@gimmeasite.com</a>
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                <Button
                  className="bg-primary hover:bg-primary/90"
                  onClick={() => {
                    setSubmitted(false);
                    setEmail("");
                    setTicketType("");
                    resetTypeState();
                    setAttachments([]);
                    setAttachmentErrors([]);
                    setClientName("");
                  }}
                >
                  Submit Another Ticket
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://gimmeasite.com">Back to Home</a>
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <TicketCheck className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold text-primary">Open a Ticket</h1>
                <p className="text-xs font-medium text-muted-foreground/60 mt-1 uppercase tracking-widest">Paid Customers Only</p>
                <p className="text-muted-foreground mt-2 text-sm">
                  Need help or want to make a change? Submit a ticket and we&apos;ll take care of it.
                </p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setRevisionCheck(null); setEmailVerified(null); setClientPlan(null); setBillingDate(null); setRevisionCredits(0); if (ticketType) { setTicketType(""); resetTypeState(); } }}
                      className="bg-background"
                      required
                      autoFocus
                    />
                    {emailChecking && (
                      <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                        <span className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin inline-block" />
                        Verifying your account...
                      </p>
                    )}
                    {!emailChecking && emailVerified === "valid" && (
                      <p className="text-xs text-green-500 mt-1.5 flex items-center gap-1">
                        <Check className="w-3 h-3" /> Account verified. You're good to go!
                      </p>
                    )}
                    {!emailChecking && emailVerified === "invalid" && (
                      <p className="text-xs text-red-500 mt-1.5">No paid account found for this email. Please <a href="mailto:hello@gimmeasite.com" className="font-bold underline underline-offset-2">contact us</a> if you believe this is an error.</p>
                    )}
                    {!emailChecking && emailVerified === null && (
                      <p className="text-xs text-muted-foreground mt-1.5">Enter the email you used when you paid for your site.</p>
                    )}
                  </div>

                  {/* Support expired notice for one-time plan users */}
                  {emailReady && supportExpired && (
                    <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 text-sm text-yellow-200">
                      <Info className="w-4 h-4 mt-0.5 shrink-0 text-yellow-400" />
                      <span>Your complimentary 6-month support period has ended. You can renew your support below — or reach us at <a href="mailto:hello@gimmeasite.com" className="font-bold underline underline-offset-2">hello@gimmeasite.com</a> with any questions.</span>
                    </div>
                  )}

                  {/* Ticket Type */}
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Ticket Type <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      {showTypeDropdown && (
                        <div className="fixed inset-0 z-[5]" onClick={() => setShowTypeDropdown(false)} />
                      )}
                      <button
                        type="button"
                        className={`w-full h-11 flex items-center justify-between bg-background border border-input rounded-lg px-4 py-2 text-left text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${emailReady ? "hover:border-primary/50 cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
                        onClick={() => { if (emailReady) setShowTypeDropdown(!showTypeDropdown); }}
                        disabled={!emailReady}
                      >
                        <span className={ticketType ? "text-foreground" : "text-muted-foreground"}>
                          {selectedLabel || "Select a Ticket Type"}
                        </span>
                        <svg
                          className={`w-4 h-4 text-muted-foreground transition-transform ${showTypeDropdown ? "rotate-180" : ""}`}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showTypeDropdown && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                          {ticketType && (
                            <button
                              type="button"
                              className="w-full px-3 py-2 text-left text-sm text-muted-foreground hover:bg-muted/50 transition-colors border-b border-border"
                              onClick={clearTypeSelection}
                            >
                              Clear Selection
                            </button>
                          )}
                          {availableTicketTypes.map((t) => (
                            <button
                              key={t.value}
                              type="button"
                              className={`w-full px-3 py-2 text-left text-sm hover:bg-primary/10 transition-colors ${
                                ticketType === t.value ? "bg-primary/10 text-primary" : ""
                              }`}
                              onClick={() => handleTypeSelect(t.value)}
                            >
                              {t.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* All fields below gated on emailReady */}
                  {/* Revision limit feedback */}
                  {isRevision && email && emailReady && (
                    revisionChecking ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <div className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                        Checking revision allowance...
                      </div>
                    ) : revisionCheck && (
                      revisionLimitReached ? (
                        <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-500">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>
                            You&apos;ve used all {revisionCheck.limit} of your revision{revisionCheck.limit === 1 ? "" : "s"}{" "}
                            {revisionCheck.period === "monthly" ? "for this month" : "included in your plan"}.{" "}
                            No worries — you can grab more with a <button type="button" className="underline font-medium" onClick={() => handleTypeSelect("extra_revisions")}>Revision Refill</button> ticket. A small fee applies depending on the pack. You can also reach us at{" "}
                            <a href="mailto:hello@gimmeasite.com" className="underline font-medium">hello@gimmeasite.com</a>.
                          </span>
                        </div>
                      ) : revisionCheck.limit !== null && (
                        <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 text-xs text-green-600 dark:text-green-400">
                          <Info className="w-3.5 h-3.5 flex-shrink-0" />
                          {revisionCheck.used} of {revisionCheck.limit} revision{revisionCheck.limit === 1 ? "" : "s"} used{" "}
                          {revisionCheck.period === "monthly" ? "this month" : "in total"}.
                        </div>
                      )
                    )
                  )}

                  {/* Cancellation notice */}
                  {isCancellation && emailReady && (
                    <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-4 text-sm text-primary space-y-2">
                      <p className="font-semibold">Before you go — take your site with you.</p>
                      <p>
                        If you&apos;d like to keep your domain and/or website files, open a{" "}
                        <button
                          type="button"
                          className="underline underline-offset-2 font-medium hover:opacity-80 transition-opacity"
                          onClick={() => { setTicketType("transfer_ownership"); resetTypeState(); }}
                        >
                          Transfer of Ownership
                        </button>
                        {" "}ticket and we&apos;ll get everything over to you.
                      </p>
                      <p>
                        Ready to cancel? Head to the{" "}
                        <a href="https://gimmeasite.com/billing" className="underline underline-offset-2 font-medium hover:opacity-80 transition-opacity">
                          Billing Portal
                        </a>
                        {" "}to manage your subscription.
                      </p>
                    </div>
                  )}

                  {/* Transfer of Ownership checkboxes */}
                  {isTransfer && emailReady && (
                    <div className="space-y-3 p-4 rounded-xl bg-secondary/40 border border-border/50">
                      <p className="text-sm font-medium">What would you like transferred? <span className="text-red-500">*</span></p>
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={transferDomain}
                          onChange={(e) => setTransferDomain(e.target.checked)}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-sm">Domain</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={transferFiles}
                          onChange={(e) => setTransferFiles(e.target.checked)}
                          className="w-4 h-4 accent-primary"
                        />
                        <span className="text-sm">Website Files</span>
                      </label>
                    </div>
                  )}

                  {/* Domain Change — new domain search */}
                  {isDomainChange && emailReady && (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          What would you like your domain changed to? <span className="text-red-500">*</span>
                        </label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            placeholder="example.com"
                            value={domainChangeQuery}
                            onChange={(e) => {
                              setDomainChangeQuery(e.target.value);
                              setDomainChangeAvailability(null);
                            }}
                            onBlur={() => { if (domainChangeQuery.trim()) checkDomainChange(domainChangeQuery); }}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); checkDomainChange(domainChangeQuery); } }}
                            className={`bg-background flex-1 ${
                              domainChangeAvailability === "available" ? "border-green-500" :
                              domainChangeAvailability === "unavailable" ? "border-red-500" : ""
                            }`}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="flex-shrink-0 hover:bg-primary/10 hover:border-primary/50"
                            onClick={() => checkDomainChange(domainChangeQuery)}
                            disabled={domainChangeChecking}
                          >
                            <Search className="w-4 h-4" />
                          </Button>
                        </div>
                        {domainChangeChecking && (
                          <p className="text-orange-500 text-xs mt-1">Checking availability...</p>
                        )}
                        {!domainChangeChecking && domainChangeAvailability === "available" && (
                          <p className="text-green-500 text-xs mt-1 flex items-center gap-1">
                            <Check className="w-3 h-3" /> This domain appears to be available!
                          </p>
                        )}
                        {!domainChangeChecking && domainChangeAvailability === "unavailable" && (
                          <p className="text-red-500 text-xs mt-1">This domain is already taken. You may still request it — contact us to discuss options.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Plan Change Target */}
                  {isPlanChange && emailReady && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        {isUpgradeToSubscription ? "Which Plan would you like to upgrade to?" : isUpgradePlan ? "Which Plan would you like to upgrade to?" : "Which Plan would you like to downgrade to?"}{" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        {showPlanChangeDropdown && (
                          <div className="fixed inset-0 z-[5]" onClick={() => setShowPlanChangeDropdown(false)} />
                        )}
                        <button
                          type="button"
                          className="w-full h-11 flex items-center justify-between bg-background border border-input rounded-lg px-4 py-2 text-left text-sm hover:border-primary/50 transition-all"
                          onClick={() => setShowPlanChangeDropdown(!showPlanChangeDropdown)}
                        >
                          <span className={planChangeTarget ? "text-foreground" : "text-muted-foreground"}>
                            {planChangeTarget || "Select a Plan"}
                          </span>
                          <svg className={`w-4 h-4 text-muted-foreground transition-transform ${showPlanChangeDropdown ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {showPlanChangeDropdown && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
                            {(isUpgradeToSubscription
                              ? ["Monthly", "Hybrid", "Annual"]
                              : isUpgradePlan
                                ? effectivePlan === "monthly" ? ["Hybrid", "Annual"] : ["Annual"]
                                : effectivePlan === "annual" ? ["Hybrid", "Monthly"] : ["Monthly"]
                            ).map((plan) => (
                              <button
                                key={plan}
                                type="button"
                                className={`w-full px-3 py-2 text-left text-sm hover:bg-primary/10 transition-colors ${planChangeTarget === plan ? "bg-primary/10 text-primary" : ""}`}
                                onClick={() => { setPlanChangeTarget(plan); setShowPlanChangeDropdown(false); }}
                              >
                                {plan}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Subject — hidden for transfer, domain change, extra revisions, cancellation */}
                  {showSubject && emailReady && (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Subject <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder={SUBJECT_PLACEHOLDERS[ticketType] || "Brief description of your request"}
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="bg-background"
                        required
                        maxLength={150}
                      />
                    </div>
                  )}

                  {/* Details + Attachment — hidden only for cancellation */}
                  {!isCancellation && emailReady && (
                    <>
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Details <span className="text-red-500">*</span>
                        </label>
                        <Textarea
                          placeholder="Please describe your request or issue in as much detail as possible. The more context you provide, the faster we can help."
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="bg-background min-h-[140px] resize-y"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Attachments <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                        </label>
                        {attachments.length > 0 && (
                          <div className="space-y-1.5 mb-2">
                            {attachments.map((file, i) => (
                              <div key={i} className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2">
                                <Paperclip className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                <span className="text-xs flex-1 truncate">{file.name}</span>
                                <button type="button" onClick={() => { setAttachments(prev => prev.filter((_, j) => j !== i)); setAttachmentErrors([]); }} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                              </div>
                            ))}
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={() => fileRef.current?.click()}
                          className="w-full flex items-center gap-2 border border-dashed border-border rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                        >
                          <Paperclip className="w-4 h-4" />
                          {attachments.length > 0 ? "Add more files" : "Click to attach a file"}
                        </button>
                        <input
                          ref={fileRef}
                          type="file"
                          multiple
                          className="hidden"
                          accept=".png,.jpg,.jpeg,.webp,.gif,.mp4,.pdf,.docx,.svg,.zip,.otf"
                          onChange={(e) => {
                            const newFiles = Array.from(e.target.files || []);
                            const combined = [...attachments, ...newFiles];
                            const errs: string[] = [];
                            if (combined.length > 10) {
                              errs.push(`You can only attach up to 10 files. Please remove ${combined.length - 10} file(s).`);
                              setAttachments(combined.slice(0, 10));
                            } else {
                              setAttachments(combined);
                            }
                            const oversized = combined.filter(f => f.size > 50 * 1024 * 1024);
                            if (oversized.length > 0) {
                              errs.push(`The following file(s) exceed 50 MB and must be removed: ${oversized.map(f => f.name).join(", ")}.`);
                            }
                            setAttachmentErrors(errs);
                            if (fileRef.current) fileRef.current.value = "";
                          }}
                        />
                        {attachmentErrors.map((err, i) => (
                          <p key={i} className="text-red-500 text-xs mt-1">{err}</p>
                        ))}
                        <p className="text-xs text-muted-foreground mt-1.5">
                          PNG, JPG, WEBP, GIF, MP4, PDF, DOCX, SVG, OTF, or ZIP files accepted. Max file size 50 MB each.
                        </p>
                      </div>
                    </>
                  )}

                  {/* Upgrade Plan confirmation */}
                  {isUpgradePlan && emailReady && (
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={planChangeConfirmed}
                        onChange={(e) => setPlanChangeConfirmed(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-primary flex-shrink-0"
                      />
                      <span className="text-sm text-red-400">I understand that once I submit this ticket, I will receive an invoice for a higher rate than of my current payment terms, and if this ticket is submitted near the end of my current billing cycle, my Upgrade request may not be processed in time, meaning I could be automatically charged for my current Plan.</span>
                    </label>
                  )}

                  {/* Downgrade Plan confirmation */}
                  {isDowngradePlan && emailReady && (
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={planChangeConfirmed}
                        onChange={(e) => setPlanChangeConfirmed(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-primary flex-shrink-0"
                      />
                      <span className="text-sm text-red-400">I understand that once I submit this ticket, I will receive an invoice for a lower rate than of my current payment terms (which once confirmed, will be charged at the end of my current billing cycle), and if this ticket is submitted near the end of my current billing cycle, my Downgrade request may not be processed in time, meaning I could be automatically charged for my current Plan.</span>
                    </label>
                  )}

                  {/* Transfer of Ownership irreversibility confirmation */}
                  {isTransfer && emailReady && (
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={transferConfirmed}
                        onChange={(e) => setTransferConfirmed(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-primary flex-shrink-0"
                      />
                      <span className="text-sm text-red-400">I understand that this action is irreversible, and that once I submit this ticket, my website may go offline temporarily while GimmeASite transfers my materials.</span>
                    </label>
                  )}

                  {/* Domain change irreversibility confirmation — shown after attachment */}
                  {isDomainChange && emailReady && (
                    <label className="flex items-start gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={domainChangeConfirmed}
                        onChange={(e) => setDomainChangeConfirmed(e.target.checked)}
                        className="w-4 h-4 mt-0.5 accent-primary flex-shrink-0"
                      />
                      <span className="text-sm text-red-400">I understand that this action is irreversible, and that once I submit this ticket, my website may go offline temporarily as a part of the domain change process. I must agree to new payment terms, if applicable, before GimmeASite acquires my new domain.</span>
                    </label>
                  )}

                  {error && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-500">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{error === "__contact_error__" ? <>The email address is not recognized. Please <a href="mailto:hello@gimmeasite.com" className="font-bold underline underline-offset-2 hover:opacity-80">contact us</a> if you believe this is an error.</> : error}</span>
                    </div>
                  )}

                  {!isCancellation && emailReady && (
                    <Button
                      type="submit"
                      className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50"
                      disabled={loading || !!revisionLimitReached}
                    >
                      {loading ? "Submitting..." : "Submit Ticket"}
                    </Button>
                  )}
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      <footer className="border-t border-border/50 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; 2026 GimmeASite. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <a href="mailto:hello@gimmeasite.com" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
