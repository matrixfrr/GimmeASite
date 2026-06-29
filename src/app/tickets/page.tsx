"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, CheckCircle, AlertCircle, Mail, Paperclip, X } from "lucide-react";

type Step = "email" | "form" | "success";

const TICKET_TYPES = [
  { value: "revision", label: "Revision Request" },
  { value: "bug", label: "Bug Report" },
  { value: "inquiry", label: "General Inquiry" },
  { value: "other", label: "Other" },
];

export default function TicketsPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [ticketType, setTicketType] = useState("revision");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, ticket_type: "revision", subject: "_verify_", description: "_verify_" }),
      });
      const data = await res.json();

      if (res.status === 404) {
        setError(data.error || "Email not recognized.");
        setLoading(false);
        return;
      }

      if (data.name) {
        setClientName(data.name);
        setStep("form");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setError("Please fill out all required fields.");
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

      if (!res.ok) {
        setError(data.error || "Failed to submit ticket.");
        setLoading(false);
        return;
      }

      setStep("success");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Ticket Submitted!</h1>
          <p className="text-muted-foreground mb-2">
            Thanks, {clientName}. We&apos;ve received your ticket and will get back to you shortly.
          </p>
          <p className="text-sm text-muted-foreground">
            Questions? Reach us at{" "}
            <span className="text-primary">hello@gimmeasite.com</span>
          </p>
          <Button
            className="mt-8 bg-primary hover:bg-primary/90"
            onClick={() => {
              setStep("email");
              setEmail("");
              setTicketType("revision");
              setSubject("");
              setDescription("");
              setAttachment(null);
              setClientName("");
              setError("");
            }}
          >
            Submit Another Ticket
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold">Open a Ticket</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Need help or want to make a change? Submit a ticket and we&apos;ll take care of it.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Mail className="w-4 h-4 inline mr-1.5 text-muted-foreground" />
                  Email Address <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-background"
                  required
                  autoFocus
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Enter the email you used when you paid for your site.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-500">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? "Checking..." : (
                  <>Continue <ArrowRight className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </form>
          )}

          {step === "form" && (
            <form onSubmit={handleTicketSubmit} className="space-y-5">
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-lg px-3 py-2 text-sm text-green-500">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Verified — Welcome back, {clientName}!</span>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Ticket Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={ticketType}
                  onChange={(e) => setTicketType(e.target.value)}
                  className="w-full h-11 rounded-lg border border-input bg-background px-4 py-2 text-sm"
                  required
                >
                  {TICKET_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  What is your ticket about? <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Update the homepage hero text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="bg-background"
                  required
                  autoFocus
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
                  accept="image/*,.pdf,.doc,.docx,.txt,.zip"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Images, PDFs, documents, or ZIP files accepted.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-sm text-red-500">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setStep("email"); setError(""); }}
                  disabled={loading}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1 bg-primary hover:bg-primary/90" disabled={loading}>
                  {loading ? "Submitting..." : "Submit Ticket"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
