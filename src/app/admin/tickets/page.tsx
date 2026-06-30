"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Lock, RefreshCw, Clock, CheckCircle, AlertCircle,
  ExternalLink, DollarSign, ArrowRight, Inbox,
} from "lucide-react";

interface Ticket {
  id: string;
  email: string;
  name: string;
  plan_type: string;
  ticket_type: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  attachment_url?: string;
  custom_price?: number;
  draft_invoice_id?: string;
  invoice_scheduled_at?: string;
  invoice_sent_at?: string;
  created_at: string;
  updated_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  revision: "Revision Request",
  redesign: "Redesign Request",
  extra_revisions: "Revision Refill",
  domain_change: "Domain Change",
  bug: "Bug Report",
  inquiry: "General Inquiry",
  upfront_renewal: "Upfront Support Renewal",
  transfer_ownership: "Transfer of Ownership",
  cancellation: "Cancellation",
  other: "Other",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  in_progress: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  resolved: "bg-green-500/15 text-green-400 border-green-500/30",
};

const PLAN_LABELS: Record<string, string> = {
  "one-time": "Upfront",
  monthly: "Monthly",
  hybrid: "Hybrid",
  annual: "Annual",
};

function daysSince(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 86400000;
}

function availableDate(iso: string) {
  const d = new Date(new Date(iso).getTime() + 3 * 86400000);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function PricingPanel({ ticket, adminPassword, onSuccess }: {
  ticket: Ticket;
  adminPassword: string;
  onSuccess: (msg: string) => void;
}) {
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const isTransfer = ticket.ticket_type === "transfer_ownership";
  const isDomainChange = ticket.ticket_type === "domain_change";
  const isSubscriber = ["monthly", "hybrid", "annual"].includes(ticket.plan_type);
  const isAnnual = ticket.plan_type === "annual";

  if (!isTransfer && !isDomainChange) return null;

  const alreadySent = !!ticket.invoice_sent_at;
  const alreadyScheduled = !!ticket.draft_invoice_id && !alreadySent;

  const handleSchedule = async () => {
    const parsed = parseFloat(amount);
    if (!parsed || parsed <= 0) { setErr("Enter a valid amount."); return; }
    setLoading(true);
    setErr("");

    const body: Record<string, unknown> = {
      adminPassword,
      ticketId: ticket.id,
      email: ticket.email,
      planType: ticket.plan_type,
      ticketType: ticket.ticket_type,
      description: `GimmeASite — ${ticket.ticket_type === "transfer_ownership" ? "Transfer of Ownership" : "Domain Change"} (${ticket.email})`,
    };

    if (isTransfer || !isSubscriber) {
      body.amountCents = Math.round(parsed * 100);
    } else if (isAnnual) {
      body.newYearlyCents = Math.round(parsed * 100);
    } else {
      body.newMonthlyCents = Math.round(parsed * 100);
    }

    try {
      const res = await fetch("/api/admin/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) { setErr(data.error || "Something went wrong."); return; }
      if (data.scheduledAt) {
        const d = new Date(data.scheduledAt);
        onSuccess(`Invoice scheduled for ${d.toLocaleDateString("en-US", { month: "short", day: "numeric" })} at ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.`);
      } else {
        onSuccess(`Subscription updated to $${parsed.toFixed(2)}/${isAnnual ? "yr" : "mo"} at next billing cycle.`);
      }
      setAmount("");
    } catch {
      setErr("Request failed.");
    } finally {
      setLoading(false);
    }
  };

  const label = isTransfer || !isSubscriber
    ? "One-time fee ($)"
    : `New ${isAnnual ? "yearly" : "monthly"} price ($)`;

  const btnLabel = isTransfer || !isSubscriber ? "Schedule Invoice" : "Update Subscription";

  return (
    <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
      {alreadySent ? (
        <p className="text-xs text-green-400 flex items-center gap-1.5">
          <CheckCircle className="w-3.5 h-3.5" />
          Invoice sent {new Date(ticket.invoice_sent_at!).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}.
        </p>
      ) : alreadyScheduled ? (
        <p className="text-xs text-blue-400 flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5" />
          Invoice scheduled for {new Date(ticket.invoice_scheduled_at!).toLocaleDateString("en-US", { month: "short", day: "numeric" })} at {new Date(ticket.invoice_scheduled_at!).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}.
          {ticket.custom_price && <span className="text-muted-foreground ml-1">(${(ticket.custom_price / 100).toFixed(2)})</span>}
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <Input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="pl-7 bg-background text-sm h-9"
              />
            </div>
            <Button
              size="sm"
              onClick={handleSchedule}
              disabled={loading || !amount}
              className="h-9 gap-1.5"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
              {btnLabel}
            </Button>
          </div>
          {err && <p className="text-xs text-red-400">{err}</p>}
          {(isTransfer || !isSubscriber) && (
            <p className="text-xs text-muted-foreground/60">
              Invoice will be sent {availableDate(ticket.created_at)} (3 days after ticket received).
            </p>
          )}
          {isSubscriber && isDomainChange && (
            <p className="text-xs text-muted-foreground/60">
              Takes effect at the start of their next billing cycle. No proration.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

}

export default function AdminTicketsPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<"all" | "open" | "in_progress" | "resolved">("open");
  const [typeFilter, setTypeFilter] = useState<"all" | "transfer_ownership" | "domain_change">("all");
  const [success, setSuccess] = useState("");
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  const fetchTickets = useCallback(async (pass: string) => {
    setLoading(true);
    const res = await fetch(`/api/tickets?adminPassword=${encodeURIComponent(pass)}`);
    const data = await res.json();
    setTickets(data.tickets || []);
    setLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch("/api/quotes/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminPassword: pw }),
    });
    const data = await res.json();
    if (!data.success) { setPwError("Invalid password."); return; }
    setAdminPassword(pw);
    setAuthed(true);
    fetchTickets(pw);
  };

  const updateStatus = async (id: string, status: string) => {
    setStatusLoading(id);
    await fetch("/api/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status, adminPassword }),
    });
    setTickets((prev) => prev.map((t) => t.id === id ? { ...t, status: status as Ticket["status"] } : t));
    setStatusLoading(null);
  };

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 6000);
    return () => clearTimeout(t);
  }, [success]);

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <form onSubmit={handleLogin} className="bg-card border border-border rounded-2xl p-8 w-full max-w-sm space-y-4 shadow-xl">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold">Ticket Admin</h1>
          </div>
          <Input
            type="password"
            placeholder="Admin password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="bg-background"
            autoFocus
          />
          {pwError && <p className="text-xs text-red-400">{pwError}</p>}
          <Button type="submit" className="w-full">Sign In</Button>
        </form>
      </div>
    );
  }

  const actionableTypes = ["transfer_ownership", "domain_change"];
  const filtered = tickets.filter((t) => {
    if (filter !== "all" && t.status !== filter) return false;
    if (typeFilter !== "all" && t.ticket_type !== typeFilter) return false;
    return true;
  });
  const needsAction = tickets.filter(
    (t) => actionableTypes.includes(t.ticket_type) && t.status !== "resolved"
  );

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Ticket Admin</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{tickets.length} total tickets</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => fetchTickets(adminPassword)} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Success toast */}
        {success && (
          <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3 text-sm text-green-400">
            <CheckCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Needs action banner */}
        {needsAction.length > 0 && (
          <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 text-sm text-yellow-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{needsAction.length} Transfer / Domain Change ticket{needsAction.length > 1 ? "s" : ""} awaiting pricing.</span>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {(["all", "open", "in_progress", "resolved"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                filter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {s === "all" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
          <div className="w-px bg-border mx-1" />
          {(["all", "transfer_ownership", "domain_change"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setTypeFilter(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                typeFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {s === "all" ? "All Types" : s === "transfer_ownership" ? "Transfer" : "Domain Change"}
            </button>
          ))}
        </div>

        {/* Ticket list */}
        {loading ? (
          <div className="text-center py-16 text-muted-foreground text-sm">Loading tickets...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Inbox className="w-8 h-8 mx-auto mb-3 opacity-40" />
            <p className="text-sm">No tickets match this filter.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((ticket) => (
              <div key={ticket.id} className="bg-card border border-border rounded-2xl p-5 shadow-sm">
                {/* Top row */}
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm">{ticket.name}</span>
                      <span className="text-xs text-muted-foreground">{ticket.email}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-secondary border border-border/50">
                        {PLAN_LABELS[ticket.plan_type] ?? ticket.plan_type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {TYPE_LABELS[ticket.ticket_type] ?? ticket.ticket_type}
                      {" · "}
                      {new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[ticket.status]}`}>
                    {ticket.status === "in_progress" ? "In Progress" : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                  </span>
                </div>

                {/* Subject + description */}
                <div className="mt-3 space-y-1">
                  <p className="text-sm font-medium">{ticket.subject}</p>
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{ticket.description}</p>
                </div>

                {/* Attachment */}
                {ticket.attachment_url && (
                  <a
                    href={ticket.attachment_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> View Attachment
                  </a>
                )}

                {/* Pricing panel for Transfer / Domain Change */}
                <PricingPanel
                  ticket={ticket}
                  adminPassword={adminPassword}
                  onSuccess={(msg) => setSuccess(msg)}
                />

                {/* Status controls */}
                <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground mr-1">Move to:</span>
                  {(["open", "in_progress", "resolved"] as const)
                    .filter((s) => s !== ticket.status)
                    .map((s) => (
                      <button
                        key={s}
                        disabled={statusLoading === ticket.id}
                        onClick={() => updateStatus(ticket.id, s)}
                        className="text-xs px-3 py-1 rounded-full border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                      >
                        {statusLoading === ticket.id ? "..." : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}