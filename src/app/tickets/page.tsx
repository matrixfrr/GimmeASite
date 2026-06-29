"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, CheckCircle, AlertCircle, Mail, FileText } from "lucide-react";

type Step = "email" | "form" | "success";

export default function TicketsPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [clientName, setClientName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, subject: "_verify_", description: "_verify_" }),
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
      setError("Please fill out all fields.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, subject, description }),
      });
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
            Thanks, {clientName}. We&apos;ve received your request and will get back to you shortly.
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
              setSubject("");
              setDescription("");
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
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Revision Request</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Submit a ticket to request changes to your site.
          </p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          {step === "email" && (
            <form onSubmit={handleEmailSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Mail className="w-4 h-4 inline mr-1.5 text-muted-foreground" />
                  Email Address
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
                  Subject <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="e.g. Update homepage hero text"
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
                  Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Describe the changes you need in as much detail as possible..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="bg-background min-h-[140px] resize-y"
                  required
                />
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
