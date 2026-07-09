"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Lock, Plus, Trash2, DollarSign, Users, CheckCircle, Clock, LogOut,
  RefreshCw, Zap, Calendar, Layers, Star, MessageSquare, AlertCircle,
  ChevronRight, ExternalLink, Inbox, ArrowRight,
} from "lucide-react";

interface ClientQuote {
  id: string;
  email: string;
  name: string;
  plan_type: "one-time" | "monthly" | "annual" | "hybrid";
  price_cents: number;
  notes?: string;
  created_at: string;
  paid: boolean;
  paid_at?: string;
}

interface Ticket {
  id: string;
  quote_id: string;
  email: string;
  name: string;
  plan_type: string;
  subject: string;
  description: string;
  status: "open" | "in_progress" | "resolved";
  ticket_type: string;
  attachment_url?: string;
  attachment_urls?: string[];
  plan_change_target?: string;
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
  upgrade_to_subscription: "Upgrade to Subscription",
  upgrade_plan: "Upgrade Plan",
  downgrade_plan: "Downgrade Plan",
  other: "Other",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  resolved: "bg-green-500/10 text-green-500 border-green-500/30",
};

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
      description: `GimmeASite — ${isTransfer ? "Transfer of Ownership" : "Domain Change"} (${ticket.email})`,
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

  const label = isTransfer || !isSubscriber ? "One-time fee ($)" : `New ${isAnnual ? "yearly" : "monthly"} price ($)`;
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
            <Button size="sm" onClick={handleSchedule} disabled={loading || !amount} className="h-9 gap-1.5">
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

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [quotes, setQuotes] = useState<ClientQuote[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<"quotes" | "tickets">("quotes");
  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "in_progress" | "resolved">("open");
  const [ticketTypeFilter, setTicketTypeFilter] = useState<"all" | "transfer_ownership" | "domain_change">("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | null>(null);
  const [planFilter, setPlanFilter] = useState<"upfront" | "monthly" | "hybrid" | "annual" | null>(null);
  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(""), 5000);
    return () => clearTimeout(t);
  }, [success]);

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    plan_type: "one-time" as "one-time" | "monthly" | "annual" | "hybrid",
    price: "",
    notes: "",
    upfrontPrice: "",
    monthlyPrice: "",
  });

  const fetchData = useCallback(async (pass: string) => {
    setLoading(true);
    try {
      const [quotesRes, ticketsRes] = await Promise.all([
        fetch(`/api/quotes`),
        fetch(`/api/tickets?adminPassword=${encodeURIComponent(pass)}`),
      ]);
      const quotesData = await quotesRes.json();
      const ticketsData = await ticketsRes.json();
      if (quotesData.quotes) setQuotes(quotesData.quotes);
      if (ticketsData.tickets) setTickets(ticketsData.tickets);
    } catch {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/quotes/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: password }),
      });
      const data = await res.json();
      if (data.error || !data.success) { setError("Invalid admin password"); return; }
      setAdminPassword(password);
      setIsAuthenticated(true);
      await fetchData(password);
      fetch("/api/admin/fix-annual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: password }),
      }).catch(() => {});
    } catch {
      setError("Failed to authenticate");
    } finally {
      setLoading(false);
    }
  };

  const handleTicketStatus = async (id: string, status: string) => {
    setStatusLoading(id);
    try {
      await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, adminPassword }),
      });
      setTickets(prev => prev.map(t => t.id === id ? { ...t, status: status as Ticket["status"] } : t));
    } catch {
      setError("Failed to update ticket");
    } finally {
      setStatusLoading(null);
    }
  };

  const handleTicketDelete = async (id: string) => {
    if (!confirm("Delete this ticket? This cannot be undone.")) return;
    try {
      const res = await fetch("/api/tickets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminPassword }),
      });
      let data: Record<string, unknown> = {};
      try { data = await res.json(); } catch { /* non-JSON response */ }
      if (!res.ok || data.error) {
        setError(String(data.error || `HTTP ${res.status}: ${res.statusText}`));
        return;
      }
      setTickets(prev => prev.filter(t => t.id !== id));
      setSuccess("Ticket deleted.");
    } catch (err) {
      setError(`Failed to delete ticket: ${err instanceof Error ? err.message : String(err)}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      let plan_type: string;
      let price_cents: number;
      let notes: string;

      if (formData.plan_type === "annual") {
        plan_type = "annual";
        price_cents = Math.round(parseFloat(formData.price) * 100);
        if (price_cents < 2) { setError("Price must be at least $0.02."); setLoading(false); return; }
        notes = formData.notes;
      } else if (formData.plan_type === "hybrid") {
        plan_type = "hybrid";
        price_cents = Math.round(parseFloat(formData.upfrontPrice) * 100);
        const monthlyCents = Math.round(parseFloat(formData.monthlyPrice) * 100);
        if (price_cents < 2 || monthlyCents < 2) { setError("All prices must be at least $0.02."); setLoading(false); return; }
        notes = `[monthly_cents:${monthlyCents}]${formData.notes ? ` ${formData.notes}` : ""}`;
      } else {
        plan_type = formData.plan_type;
        price_cents = Math.round(parseFloat(formData.price) * 100);
        if (price_cents < 2) { setError("Price must be at least $0.02."); setLoading(false); return; }
        notes = formData.notes;
      }

      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formData.email, name: formData.name, plan_type, price_cents, notes, adminPassword }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setSuccess(`Quote created for ${formData.name}!`);
      setFormData({ email: "", name: "", plan_type: "one-time", price: "", notes: "", upfrontPrice: "", monthlyPrice: "" });
      fetchData(adminPassword);
    } catch {
      setError("Failed to create quote");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuote = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quote?")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/quotes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminPassword }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      setSuccess("Quote deleted!");
      fetchData(adminPassword);
    } catch {
      setError("Failed to delete quote");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const getMonthlyFromNotes = (notes?: string): number | null => {
    const match = notes?.match(/\[monthly_cents:(\d+)\]/);
    return match ? parseInt(match[1]) : null;
  };

  const cleanNotes = (notes?: string) =>
    notes?.replace(/\[monthly_cents:\d+\]\s*/g, "").trim() || "";

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Admin Access</h1>
              <p className="text-muted-foreground mt-2">Enter your admin password to continue</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
              <Input
                type="password"
                placeholder="Admin Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-background"
                required
              />
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                {loading ? "Authenticating..." : "Access Admin Panel"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const allUnpaid = quotes.filter(q => !q.paid);
  const allPaid = quotes.filter(q => q.paid);

  const getPlanKey = (q: ClientQuote) => {
    const hasMonthlyCents = q.notes ? /Monthly price: \$[\d.]+/.test(q.notes) : false;
    if (q.plan_type === "annual") return "annual";
    if (q.plan_type === "monthly") return "monthly";
    if (hasMonthlyCents || q.plan_type === "hybrid") return "hybrid";
    return "upfront";
  };

  const isFiltered = statusFilter !== null || planFilter !== null;
  const filteredTitle = statusFilter === "all" ? "Total" : statusFilter === "pending" ? "Pending Payment" : statusFilter === "paid" ? "Paid" : planFilter === "upfront" ? "Upfront" : planFilter === "monthly" ? "Monthly" : planFilter === "hybrid" ? "Hybrid" : planFilter === "annual" ? "Annual" : "";
  const filteredQuotes = statusFilter === "all" ? quotes : statusFilter === "pending" ? allUnpaid : statusFilter === "paid" ? allPaid : planFilter ? allUnpaid.filter(q => getPlanKey(q) === planFilter) : [];
  const unpaidQuotes = allUnpaid;
  const paidQuotes = allPaid;

  const openTickets = tickets.filter(t => t.status === "open");
  const inProgressTickets = tickets.filter(t => t.status === "in_progress");
  const resolvedTickets = tickets.filter(t => t.status === "resolved");

  const filteredTickets = tickets.filter(t => {
    if (ticketFilter !== "all" && t.status !== ticketFilter) return false;
    if (ticketTypeFilter !== "all" && t.ticket_type !== ticketTypeFilter) return false;
    return true;
  });

  const needsAction = tickets.filter(t =>
    ["transfer_ownership", "domain_change"].includes(t.ticket_type) && t.status !== "resolved"
  );

  const QuoteCard = ({ quote, dimmed = false }: { quote: ClientQuote; dimmed?: boolean }) => {
    const monthlyCents = getMonthlyFromNotes(quote.notes);
    const isAnnual = quote.plan_type === "annual";
    const displayNotes = cleanNotes(quote.notes);
    return (
      <div className={`bg-card border rounded-xl p-4 transition-colors ${dimmed ? "border-green-500/20 opacity-75" : "border-border hover:border-primary/30"}`}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold truncate">{quote.name}</h3>
              {dimmed ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">Paid</span>
              ) : (
                <span className={`text-xs px-2 py-0.5 rounded-full ${isAnnual ? "bg-cyan-500/10 text-cyan-400" : quote.plan_type === "monthly" ? "bg-violet-500/10 text-violet-400" : monthlyCents ? "bg-pink-400/10 text-pink-400" : "bg-red-400/10 text-red-400"}`}>
                  {isAnnual ? "Annual" : quote.plan_type === "monthly" ? "Monthly" : monthlyCents ? "Hybrid" : "Upfront"}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{quote.email}</p>
            {displayNotes && !dimmed && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{displayNotes}</p>}
            <p className="text-xs text-muted-foreground mt-2">{dimmed && quote.paid_at ? `Paid: ${formatDate(quote.paid_at)}` : `Created: ${formatDate(quote.created_at)}`}</p>
          </div>
          <div className="text-right flex-shrink-0">
            {monthlyCents && !dimmed ? (
              <div>
                <p className="text-base font-bold text-primary">{formatPrice(quote.price_cents)}</p>
                <p className="text-xs text-muted-foreground">upfront</p>
                <p className="text-base font-bold text-primary">+ {formatPrice(monthlyCents)}</p>
                <p className="text-xs text-muted-foreground">/month</p>
              </div>
            ) : (
              <div>
                <p className={`text-xl font-bold ${dimmed ? "text-green-500" : "text-primary"}`}>{formatPrice(quote.price_cents)}</p>
                {!dimmed && (isAnnual ? <p className="text-xs text-muted-foreground">/year</p> : quote.plan_type === "monthly" ? <p className="text-xs text-muted-foreground">/month</p> : null)}
              </div>
            )}
            <Button variant="ghost" size="sm" className="mt-2 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDeleteQuote(quote.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">GimmeASite Admin</h1>
              <p className="text-xs text-muted-foreground">Client Management</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => fetchData(adminPassword)} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={() => { setIsAuthenticated(false); setPassword(""); setAdminPassword(""); }}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 pb-0 flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("quotes")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === "quotes" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <DollarSign className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Quotes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tickets")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors relative ${activeTab === "tickets" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >
            <MessageSquare className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Tickets
            {openTickets.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                {openTickets.length}
              </span>
            )}
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Global success/error banners */}
        {success && (
          <div className={`mb-6 flex items-center gap-2 border rounded-lg px-4 py-3 text-sm ${success.includes("deleted") || success.includes("Deleted") ? "bg-red-500/10 border-red-500/30 text-red-400" : "bg-green-500/10 border-green-500/30 text-green-400"}`}>
            <CheckCircle className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}
        {error && (
          <div className="mb-6 flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
            <button type="button" className="ml-auto text-red-400/60 hover:text-red-400" onClick={() => setError("")}>✕</button>
          </div>
        )}

        {activeTab === "quotes" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <button type="button" onClick={() => { setStatusFilter(f => f === "all" ? null : "all"); setPlanFilter(null); }} className={`bg-card border rounded-xl p-6 text-left transition-colors hover:border-blue-500/50 ${statusFilter === "all" ? "border-blue-500" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center"><Users className="w-6 h-6 text-blue-500" /></div>
                  <div><p className="text-2xl font-bold">{quotes.length}</p><p className="text-sm text-muted-foreground">Total Quotes</p></div>
                </div>
              </button>
              <button type="button" onClick={() => { setStatusFilter(f => f === "pending" ? null : "pending"); setPlanFilter(null); }} className={`bg-card border rounded-xl p-6 text-left transition-colors hover:border-amber-500/50 ${statusFilter === "pending" ? "border-amber-500" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center"><Clock className="w-6 h-6 text-amber-500" /></div>
                  <div><p className="text-2xl font-bold">{allUnpaid.length}</p><p className="text-sm text-muted-foreground">Pending Payment</p></div>
                </div>
              </button>
              <button type="button" onClick={() => { setStatusFilter(f => f === "paid" ? null : "paid"); setPlanFilter(null); }} className={`bg-card border rounded-xl p-6 text-left transition-colors hover:border-green-500/50 ${statusFilter === "paid" ? "border-green-500" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-500" /></div>
                  <div><p className="text-2xl font-bold">{allPaid.length}</p><p className="text-sm text-muted-foreground">Paid</p></div>
                </div>
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-8">
              {([["upfront","Upfront","bg-red-400/10 text-red-400 border-red-400/30 hover:border-red-400","border-red-400"],["monthly","Monthly","bg-violet-500/10 text-violet-400 border-violet-400/30 hover:border-violet-400","border-violet-400"],["hybrid","Hybrid","bg-pink-400/10 text-pink-400 border-pink-400/30 hover:border-pink-400","border-pink-400"],["annual","Annual","bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:border-cyan-500","border-cyan-500"]] as const).map(([key, label, baseClass, activeClass]) => (
                <button key={key} type="button" disabled={statusFilter === "paid"} onClick={() => { setPlanFilter(f => f === key ? null : key); setStatusFilter(null); }}
                  className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${baseClass} ${planFilter === key ? activeClass : ""}`}>
                  {label}
                </button>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    Add New Quote
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Client Name <span className="text-red-500">*</span></label>
                      <Input placeholder="John Doe" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="bg-background" required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email Address <span className="text-red-500">*</span></label>
                      <Input type="email" placeholder="client@example.com" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} className="bg-background" required />
                      <p className="text-xs text-muted-foreground mt-1">Must match the email they&apos;ll use to pay</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Plan Type <span className="text-red-500">*</span></label>
                      <select value={formData.plan_type} onChange={e => setFormData({ ...formData, plan_type: e.target.value as "one-time" | "monthly" | "annual" | "hybrid", price: "", upfrontPrice: "", monthlyPrice: "" })}
                        className="w-full h-11 rounded-lg border border-input bg-background px-4 py-2 text-sm" required>
                        <option value="one-time">Upfront</option>
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Price (USD) <span className="text-red-500">*</span></label>
                      {formData.plan_type === "hybrid" ? (
                        <div className="space-y-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Upfront Cost</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <Input type="number" step="0.01" min="0" placeholder="499.00" value={formData.upfrontPrice} onChange={e => setFormData({ ...formData, upfrontPrice: e.target.value })} className="bg-background pl-7" required />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Monthly Cost</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <Input type="number" step="0.01" min="1" placeholder="199.00" value={formData.monthlyPrice} onChange={e => setFormData({ ...formData, monthlyPrice: e.target.value })} className="bg-background pl-7" required />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">Client pays both at checkout; monthly continues thereafter</p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input type="number" step="0.01" min="1" placeholder={formData.plan_type === "annual" ? "2030.00" : "1499.00"} value={formData.price} onChange={e => setFormData({ ...formData, price: e.target.value })} className="bg-background pl-7" required />
                          </div>
                          {formData.plan_type === "monthly" && <p className="text-xs text-muted-foreground mt-1">This will be the recurring monthly charge</p>}
                          {formData.plan_type === "annual" && <p className="text-xs text-muted-foreground mt-1">This will be the recurring annual charge.</p>}
                        </>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                      <Textarea placeholder="Project details, special requirements..." value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} className="bg-background min-h-[80px]" />
                    </div>
                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                      {loading ? "Creating..." : "Create Quote"}
                    </Button>
                  </form>
                </div>
              </div>

              <div className="lg:col-span-2 space-y-6">
                {isFiltered ? (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      {statusFilter === "paid" ? <CheckCircle className="w-5 h-5 text-green-500" /> : statusFilter === "all" ? <Users className="w-5 h-5 text-blue-500" /> : planFilter === "upfront" ? <Zap className="w-5 h-5 text-red-400" /> : planFilter === "monthly" ? <Calendar className="w-5 h-5 text-violet-400" /> : planFilter === "hybrid" ? <Layers className="w-5 h-5 text-pink-400" /> : planFilter === "annual" ? <Star className="w-5 h-5 text-cyan-400" /> : <Clock className="w-5 h-5 text-amber-500" />}
                      {filteredTitle} ({filteredQuotes.length})
                    </h2>
                    {filteredQuotes.length === 0 ? (
                      <div className="bg-card border border-border rounded-xl p-8 text-center"><p className="text-muted-foreground">No quotes found</p></div>
                    ) : (
                      <div className="space-y-3">
                        {filteredQuotes.map(q => <QuoteCard key={q.id} quote={q} dimmed={q.paid} />)}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div>
                      <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-500" />
                        Pending Payment ({unpaidQuotes.length})
                      </h2>
                      {unpaidQuotes.length === 0 ? (
                        <div className="bg-card border border-border rounded-xl p-8 text-center"><p className="text-muted-foreground">No pending quotes</p></div>
                      ) : (
                        <div className="space-y-3">{unpaidQuotes.map(q => <QuoteCard key={q.id} quote={q} />)}</div>
                      )}
                    </div>
                    {paidQuotes.length > 0 && (
                      <div>
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-500" />
                          Paid ({paidQuotes.length})
                        </h2>
                        <div className="space-y-3">{paidQuotes.map(q => <QuoteCard key={q.id} quote={q} dimmed />)}</div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {activeTab === "tickets" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button type="button" onClick={() => setTicketFilter(f => f === "open" ? "all" : "open")} className={`bg-card border rounded-xl p-6 text-left transition-colors hover:border-amber-500/50 ${ticketFilter === "open" ? "border-amber-500" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center"><AlertCircle className="w-6 h-6 text-amber-500" /></div>
                  <div><p className="text-2xl font-bold">{openTickets.length}</p><p className="text-sm text-muted-foreground">Open</p></div>
                </div>
              </button>
              <button type="button" onClick={() => setTicketFilter(f => f === "in_progress" ? "all" : "in_progress")} className={`bg-card border rounded-xl p-6 text-left transition-colors hover:border-blue-500/50 ${ticketFilter === "in_progress" ? "border-blue-500" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center"><ChevronRight className="w-6 h-6 text-blue-500" /></div>
                  <div><p className="text-2xl font-bold">{inProgressTickets.length}</p><p className="text-sm text-muted-foreground">In Progress</p></div>
                </div>
              </button>
              <button type="button" onClick={() => setTicketFilter(f => f === "resolved" ? "all" : "resolved")} className={`bg-card border rounded-xl p-6 text-left transition-colors hover:border-green-500/50 ${ticketFilter === "resolved" ? "border-green-500" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center"><CheckCircle className="w-6 h-6 text-green-500" /></div>
                  <div><p className="text-2xl font-bold">{resolvedTickets.length}</p><p className="text-sm text-muted-foreground">Resolved</p></div>
                </div>
              </button>
            </div>

            {/* Needs action banner */}
            {needsAction.length > 0 && (
              <div className="flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-4 py-3 text-sm text-yellow-300 mb-4">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{needsAction.length} Transfer / Domain Change ticket{needsAction.length > 1 ? "s" : ""} awaiting pricing.</span>
              </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              {(["all", "open", "in_progress", "resolved"] as const).map(s => (
                <button key={s} type="button" onClick={() => setTicketFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${ticketFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                  {s === "all" ? "All" : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
              <div className="w-px bg-border mx-1" />
              {(["all", "transfer_ownership", "domain_change"] as const).map(s => (
                <button key={s} type="button" onClick={() => setTicketTypeFilter(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${ticketTypeFilter === s ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                  {s === "all" ? "All Types" : s === "transfer_ownership" ? "Transfer" : "Domain Change"}
                </button>
              ))}
            </div>

            {/* Ticket list */}
            {filteredTickets.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground">No tickets match this filter</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map(ticket => {
                  const allUrls = ticket.attachment_urls?.length ? ticket.attachment_urls : ticket.attachment_url ? [ticket.attachment_url] : [];
                  return (
                    <div key={ticket.id} className={`bg-card border rounded-2xl p-5 shadow-sm transition-colors ${ticket.status === "resolved" ? "border-green-500/20 opacity-70" : ticket.status === "in_progress" ? "border-blue-500/20" : "border-amber-500/20"}`}>
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-sm">{ticket.name}</span>
                            <span className="text-xs text-muted-foreground">{ticket.email}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-secondary border border-border/50">
                              {{ "one-time": "Upfront", monthly: "Monthly", hybrid: "Hybrid", annual: "Annual" }[ticket.plan_type] ?? ticket.plan_type}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {TYPE_LABELS[ticket.ticket_type] ?? ticket.ticket_type}
                            {ticket.plan_change_target && ` → ${ticket.plan_change_target}`}
                            {" · "}{new Date(ticket.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${STATUS_COLORS[ticket.status]}`}>
                            {ticket.status === "in_progress" ? "In Progress" : ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
                          </span>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-400 hover:bg-red-500/10 h-7 w-7 p-0" onClick={() => handleTicketDelete(ticket.id)}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-3 space-y-1">
                        <p className="text-sm font-medium">{ticket.subject}</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">{ticket.description}</p>
                      </div>

                      {allUrls.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {allUrls.map((url, i) => (
                            <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
                              <ExternalLink className="w-3 h-3" /> Attachment {allUrls.length > 1 ? i + 1 : ""}
                            </a>
                          ))}
                        </div>
                      )}

                      <PricingPanel ticket={ticket} adminPassword={adminPassword} onSuccess={msg => setSuccess(msg)} />

                      <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-muted-foreground mr-1">Move to:</span>
                        {(["open", "in_progress", "resolved"] as const).filter(s => s !== ticket.status).map(s => (
                          <button key={s} type="button" disabled={statusLoading === ticket.id} onClick={() => handleTicketStatus(ticket.id, s)}
                            className="text-xs px-3 py-1 rounded-full border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                            {statusLoading === ticket.id ? "..." : s === "in_progress" ? "In Progress" : s.charAt(0).toUpperCase() + s.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
