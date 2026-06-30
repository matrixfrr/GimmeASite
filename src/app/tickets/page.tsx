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
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [revisionCheck, setRevisionCheck] = useState<RevisionCheck | null>(null);
  const [revisionChecking, setRevisionChecking] = useState(false);
  const [transferDomain, setTransferDomain] = useState(false);
  const [transferFiles, setTransferFiles] = useState(false);
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
        return true;
      });

  const showSubject = !isCancellation && !isTransfer && !isDomainChange;

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
          setEmailVerified(res.ok ? "valid" : "invalid");
          if (res.ok) { const d = await res.json(); if (!cancelled) { setClientPlan(d.plan ?? null); setBillingDate(d.billingDate ?? null); setRevisionCredits(d.revisionCredits ?? 0); } }
          else { setClientPlan(null); setBillingDate(null); setRevisionCredits(0); }
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

  const resetTypeState = () => {
    setSubject("");
    setDescription("");
    setError("");
    setRevisionCheck(null);
    setTransferDomain(false);
    setTransferFiles(false);
    setDomainChangeQuery("");
    setDomainChangeAvailability(null);
    setDomainChangeConfirmed(false);
    setDomainChangeChecking(false);
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
    if (isTransfer && !transferDomain && !transferFiles) {
      setError("Please select at least one option for what you would like transferred.");
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
      } else {
        fd.append("subject", subject);
      }
      fd.append("description", description);
      if (attachment) fd.append("attachment", attachment);

      const res = await fetch("/api/tickets", { method: "POST", body: fd });
      const data = await res.json();

      if (res.status === 404) { setError("__contact_error__"); setLoading(false); return; }
      if (!res.ok) { setError(data.error || "Failed to submit ticket."); setLoading(false); return; }

      setClientName(data.name || "");
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
              <Button
                className="mt-8 bg-primary hover:bg-primary/90"
                onClick={() => {
                  setSubmitted(false);
                  setEmail("");
                  setTicketType("");
                  resetTypeState();
                  setAttachment(null);
                  setClientName("");
                }}
              >
                Submit Another Ticket
              </Button>
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
                          {TICKET_TYPES.map((t) => (
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
                  <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-3 text-xs text-yellow-600 dark:text-yellow-400">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>A small additional fee may apply once your ticket is resolved. We'll always reach out before charging anything extra.</span>
                  </div>
                    </div>
                  )}

                  {/* Upfront Support Renewal notice */}
                  {isUpfrontRenewal && emailReady && (
                  <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-3 text-xs text-yellow-600 dark:text-yellow-400">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>A small additional fee may apply once your ticket is resolved. We'll always reach out before charging anything extra.</span>
                  </div>
                  )}

                  {/* Redesign notice */}
                  {isRedesign && emailReady && (
                    <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-3 text-xs text-yellow-600 dark:text-yellow-400">
                      <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                      <span>Additional fees will be due before your redesign goes live. We'll always confirm pricing with you before moving forward.</span>
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
                      <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-3 text-xs text-yellow-600 dark:text-yellow-400">
                        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span>Domain changes may take an extended amount of time to process and could affect your pricing, as the new domain may cost more depending on availability and registration fees.</span>
                      </div>
                    </div>
                  )}

                  {/* Revision Refill charge notice */}
                  {isExtraRevisions && emailReady && (
                  <div className="flex items-start gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-3 text-xs text-yellow-600 dark:text-yellow-400">
                    <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>A small additional fee may apply once your ticket is resolved. We'll always reach out before charging anything extra.</span>
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
                          Attachment <span className="text-xs text-muted-foreground font-normal">(optional)</span>
                        </label>
                        {attachment ? (
                          <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-2.5">
                            <Paperclip className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-sm flex-1 truncate">{attachment.name}</span>
                            <button
                              type="button"
                              onClick={() => { setAttachment(null); if (fileRef.current) fileRef.current.value = ""; }}
                              className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => fileRef.current?.click()}
                            className="w-full flex items-center gap-2 border border-dashed border-border rounded-lg px-3 py-2.5 text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                          >
                            <Paperclip className="w-4 h-4" />
                            Click to attach a file
                          </button>
                        )}
                        <input
                          ref={fileRef}
                          type="file"
                          className="hidden"
                          onChange={(e) => setAttachment(e.target.files?.[0] || null)}
                          accept=".png,.jpg,.jpeg,.pdf,.docx,.zip"
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">
                          PNG, JPG, PDF, DOCX, or ZIP files accepted.
                        </p>
                      </div>
                    </>
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
                      <span className="text-sm text-red-400">I understand that this action is irreversible, and that once I submit this ticket, my current domain will be put up for sale and my new domain will be acquired upon agreeing to my new payment terms, if applicable.</span>
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
