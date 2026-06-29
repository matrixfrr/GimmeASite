"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, AlertCircle, Paperclip, X, TicketCheck, Info } from "lucide-react";
import Link from "next/link";

const TICKET_TYPES = [
  { value: "revision", label: "Revision Request" },
  { value: "redesign", label: "Full Redesign Request" },
  { value: "extra_revisions", label: "Revision Refill" },
  { value: "domain_change", label: "Domain Change" },
  { value: "bug", label: "Bug Report" },
  { value: "inquiry", label: "General Inquiry" },
  { value: "cancellation", label: "Cancellation" },
  { value: "other", label: "Other" },
];

const SUBJECT_PLACEHOLDERS: Record<string, string> = {
  revision: "Brief description of the change needed",
  extra_revisions: "Brief description of your refill request",
  redesign: "Brief description of the redesign scope",
  domain_change: "Brief description of the domain change",
  bug: "Brief description of the issue",
  inquiry: "Brief description of your question",
  other: "Brief description of your request",
};

interface RevisionCheck {
  allowed: boolean;
  used: number;
  limit: number | null;
  period: "total" | "monthly";
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
  const fileRef = useRef<HTMLInputElement>(null);

  const isCancellation = ticketType === "cancellation";
  const isRevision = ticketType === "revision";
  const selectedLabel = TICKET_TYPES.find((t) => t.value === ticketType)?.label || "";

  // Check revision limit whenever email + revision type are both set
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

  const handleTypeSelect = (value: string) => {
    setTicketType(value);
    setShowTypeDropdown(false);
    setSubject("");
    setDescription("");
    setError("");
    setRevisionCheck(null);
  };

  const clearTypeSelection = () => {
    setTicketType("");
    setShowTypeDropdown(false);
    setSubject("");
    setDescription("");
    setError("");
    setRevisionCheck(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticketType) {
      setError("Please select a ticket type.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const fd = new FormData();
      fd.append("email", email);
      fd.append("ticket_type", ticketType);
      fd.append("subject", subject);
      fd.append("description", description);
      if (attachment) fd.append("attachment", attachment);

      const res = await fetch("/api/tickets", { method: "POST", body: fd });
      const data = await res.json();

      if (res.status === 404) {
        setError("__contact_error__");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(data.error || "Failed to submit ticket.");
        setLoading(false);
        return;
      }

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
      {/* Header */}
      <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img src="/favicon.svg" alt="GimmeASite" className="w-9 h-9" />
            <span className="font-bold text-xl tracking-tight">GimmeASite</span>
          </Link>
        </div>
      </header>

      {/* Main content */}
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
                  setSubject("");
                  setDescription("");
                  setAttachment(null);
                  setClientName("");
                  setError("");
                  setRevisionCheck(null);
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
                <p className="text-xs text-muted-foreground/70 mt-1.5">Please allow us sufficient time for your ticket to be resolved.</p>
              </div>

              <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => { setEmail(e.target.value); setRevisionCheck(null); }}
                      className="bg-background"
                      required
                      autoFocus
                    />
                    <p className="text-xs text-muted-foreground mt-1.5">
                      Enter the email you used when you paid for your site.
                    </p>
                  </div>

                  {/* Ticket Type custom dropdown */}
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
                        className="w-full h-11 flex items-center justify-between bg-background border border-input hover:border-primary/50 rounded-lg px-4 py-2 text-left text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        onClick={() => setShowTypeDropdown(!showTypeDropdown)}
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

                  {/* Revision limit feedback */}
                  {isRevision && email && (
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
                            Please submit a <button type="button" className="underline font-medium" onClick={() => handleTypeSelect("extra_revisions")}>Revision Refill</button> ticket or contact us at{" "}
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

                  {isCancellation && (
                    <div className="bg-primary/10 border border-primary/30 rounded-xl px-4 py-4 text-sm text-primary space-y-1">
                      <p className="font-semibold">Want to cancel your subscription?</p>
                      <p>
                        You can manage or cancel your subscription directly from the{" "}
                        <a href="https://gimmeasite.com/billing" className="underline underline-offset-2 font-medium hover:opacity-80 transition-opacity">
                          Billing Portal
                        </a>
                        .
                      </p>
                    </div>
                  )}

                  {!isCancellation && (
                    <>
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

                  {error && (
                    <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-500">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{error === "__contact_error__" ? <>The email address is not recognized. Please <a href="mailto:hello@gimmeasite.com" className="font-bold underline underline-offset-2 hover:opacity-80">contact us</a> if you believe this is an error.</> : error}</span>
                    </div>
                  )}

                  {!isCancellation && (
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

      {/* Footer */}
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
