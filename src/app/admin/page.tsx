"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Lock,
  Plus,
  Trash2,
  DollarSign,
  Users,
  CheckCircle,
  Clock,
  LogOut,
  RefreshCw,
  Zap,
  Calendar,
  Layers,
  Star,
  MessageSquare,
  AlertCircle,
  ChevronRight,
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
  created_at: string;
  updated_at: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [quotes, setQuotes] = useState<ClientQuote[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [activeTab, setActiveTab] = useState<"quotes" | "tickets">("quotes");
  const [ticketFilter, setTicketFilter] = useState<"all" | "open" | "in_progress" | "resolved">("open");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "paid" | null>(null);
  const [planFilter, setPlanFilter] = useState<"upfront" | "monthly" | "hybrid" | "annual" | null>(null);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/quotes/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ adminPassword: password }),
      });
      const data = await response.json();

      if (data.error || !data.success) {
        setError("Invalid admin password");
        return;
      }

      setAdminPassword(password);
      setIsAuthenticated(true);

      const quotesResponse = await fetch(`/api/quotes`);
      const quotesData = await quotesResponse.json();
      setQuotes(quotesData.quotes || []);

      const ticketsResponse = await fetch(`/api/tickets?adminPassword=${encodeURIComponent(password)}`);
      const ticketsData = await ticketsResponse.json();
      setTickets(ticketsData.tickets || []);

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

  const fetchQuotes = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/quotes`);
      const data = await response.json();
      if (data.quotes) setQuotes(data.quotes);

      const ticketsResponse = await fetch(`/api/tickets?adminPassword=${encodeURIComponent(adminPassword)}`);
      const ticketsData = await ticketsResponse.json();
      if (ticketsData.tickets) setTickets(ticketsData.tickets);
    } catch {
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  const handleTicketStatus = async (id: string, status: string) => {
    try {
      await fetch("/api/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, adminPassword }),
      });
      const ticketsResponse = await fetch(`/api/tickets?adminPassword=${encodeURIComponent(adminPassword)}`);
      const ticketsData = await ticketsResponse.json();
      if (ticketsData.tickets) setTickets(ticketsData.tickets);
    } catch {
      setError("Failed to update ticket");
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
        if (price_cents < 2) {
          setError("Price must be at least $0.02.");
          setLoading(false);
          return;
        }
        notes = formData.notes;
      } else if (formData.plan_type === "hybrid") {
        plan_type = "hybrid";
        price_cents = Math.round(parseFloat(formData.upfrontPrice) * 100);
        const monthlyCents = Math.round(parseFloat(formData.monthlyPrice) * 100);
        if (price_cents < 2 || monthlyCents < 2) {
          setError("All prices must be at least $0.02.");
          setLoading(false);
          return;
        }
        notes = `[monthly_cents:${monthlyCents}]${formData.notes ? ` ${formData.notes}` : ""}`;
      } else {
        plan_type = formData.plan_type;
        price_cents = Math.round(parseFloat(formData.price) * 100);
        if (price_cents < 2) {
          setError("Price must be at least $0.02.");
          setLoading(false);
          return;
        }
        notes = formData.notes;
      }

      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          plan_type,
          price_cents,
          notes,
          adminPassword,
        }),
      });

      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setSuccess(`Quote created for ${formData.name}!`);
      setFormData({
        email: "",
        name: "",
        plan_type: "one-time",
        price: "",
        notes: "",
        upfrontPrice: "",
        monthlyPrice: "",
      });
      fetchQuotes();
    } catch {
      setError("Failed to create quote");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this quote?")) return;

    setLoading(true);
    try {
      const response = await fetch("/api/quotes", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, adminPassword }),
      });
      const data = await response.json();

      if (data.error) {
        setError(data.error);
        return;
      }

      setSuccess("Quote deleted!");
      fetchQuotes();
    } catch {
      setError("Failed to delete quote");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (cents: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

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

  const allUnpaid = quotes.filter((q) => !q.paid);
  const allPaid = quotes.filter((q) => q.paid);

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
  const filteredTickets = ticketFilter === "all" ? tickets : tickets.filter(t => t.status === ticketFilter);

  const statusLabel: Record<string, string> = {
    open: "Open",
    in_progress: "In Progress",
    resolved: "Resolved",
  };
  const statusColors: Record<string, string> = {
    open: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    in_progress: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    resolved: "bg-green-500/10 text-green-500 border-green-500/30",
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
            <Button variant="outline" size="sm" onClick={fetchQuotes} disabled={loading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setIsAuthenticated(false); setPassword(""); setAdminPassword(""); }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="max-w-7xl mx-auto px-4 pb-0 flex gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("quotes")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "quotes"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <DollarSign className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            Quotes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tickets")}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors relative ${
              activeTab === "tickets"
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
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
        {activeTab === "quotes" && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <button type="button" onClick={() => { setStatusFilter(f => f === "all" ? null : "all"); setPlanFilter(null); }} className={`bg-card border rounded-xl p-6 text-left transition-colors hover:border-blue-500/50 ${statusFilter === "all" ? "border-blue-500" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{quotes.length}</p>
                    <p className="text-sm text-muted-foreground">Total Quotes</p>
                  </div>
                </div>
              </button>
              <button type="button" onClick={() => { setStatusFilter(f => f === "pending" ? null : "pending"); setPlanFilter(null); }} className={`bg-card border rounded-xl p-6 text-left transition-colors hover:border-amber-500/50 ${statusFilter === "pending" ? "border-amber-500" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{allUnpaid.length}</p>
                    <p className="text-sm text-muted-foreground">Pending Payment</p>
                  </div>
                </div>
              </button>
              <button type="button" onClick={() => { setStatusFilter(f => f === "paid" ? null : "paid"); setPlanFilter(null); }} className={`bg-card border rounded-xl p-6 text-left transition-colors hover:border-green-500/50 ${statusFilter === "paid" ? "border-green-500" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{allPaid.length}</p>
                    <p className="text-sm text-muted-foreground">Paid</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Plan filters */}
            <div className="flex flex-wrap gap-2 mb-8">
              {([["upfront","Upfront","bg-red-400/10 text-red-400 border-red-400/30 hover:border-red-400","border-red-400"],["monthly","Monthly","bg-violet-500/10 text-violet-400 border-violet-400/30 hover:border-violet-400","border-violet-400"],["hybrid","Hybrid","bg-pink-400/10 text-pink-400 border-pink-400/30 hover:border-pink-400","border-pink-400"],["annual","Annual","bg-cyan-500/10 text-cyan-400 border-cyan-500/30 hover:border-cyan-500","border-cyan-500"]] as const).map(([key, label, baseClass, activeClass]) => (
                <button
                  key={key}
                  type="button"
                  disabled={statusFilter === "paid"}
                  onClick={() => { setPlanFilter(f => f === key ? null : key); setStatusFilter(null); }}
                  className={`px-4 py-1.5 rounded-full border text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed ${baseClass} ${planFilter === key ? activeClass : ""}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Add Quote Form */}
              <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    Add New Quote
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Client Name <span className="text-red-500">*</span>
                      </label>
                      <Input
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="bg-background"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="email"
                        placeholder="client@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="bg-background"
                        required
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Must match the email they&apos;ll use to pay
                      </p>
                    </div>

                    {/* Plan Type */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Plan Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={formData.plan_type}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            plan_type: e.target.value as "one-time" | "monthly" | "annual" | "hybrid",
                            price: "",
                            upfrontPrice: "",
                            monthlyPrice: "",
                          })
                        }
                        className="w-full h-11 rounded-lg border border-input bg-background px-4 py-2 text-sm"
                        required
                      >
                        <option value="one-time">Upfront</option>
                        <option value="monthly">Monthly</option>
                        <option value="annual">Annual</option>
                        <option value="hybrid">Hybrid</option>
                      </select>
                    </div>

                    {/* Price field */}
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Price (USD) <span className="text-red-500">*</span>
                      </label>
                      {formData.plan_type === "hybrid" ? (
                        <div className="space-y-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Upfront Cost</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="499.00"
                                value={formData.upfrontPrice}
                                onChange={(e) => setFormData({ ...formData, upfrontPrice: e.target.value })}
                                className="bg-background pl-7"
                                required
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Monthly Cost</label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                              <Input
                                type="number"
                                step="0.01"
                                min="1"
                                placeholder="199.00"
                                value={formData.monthlyPrice}
                                onChange={(e) => setFormData({ ...formData, monthlyPrice: e.target.value })}
                                className="bg-background pl-7"
                                required
                              />
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Client pays both at checkout; monthly continues thereafter
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                            <Input
                              type="number"
                              step="0.01"
                              min="1"
                              placeholder={formData.plan_type === "annual" ? "2030.00" : "1499.00"}
                              value={formData.price}
                              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                              className="bg-background pl-7"
                              required
                            />
                          </div>
                          {formData.plan_type === "monthly" && (
                            <p className="text-xs text-muted-foreground mt-1">
                              This will be the recurring monthly charge
                            </p>
                          )}
                          {formData.plan_type === "annual" && (
                            <p className="text-xs text-muted-foreground mt-1">
                              This will be the recurring annual charge.
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                      <Textarea
                        placeholder="Project details, special requirements..."
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        className="bg-background min-h-[80px]"
                      />
                    </div>

                    {error && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-sm text-red-500">{error}</p>
                      </div>
                    )}
                    {success && (
                      <div className={`border rounded-lg p-3 ${success === "Quote deleted!" ? "bg-red-500/10 border-red-500/30" : "bg-green-500/10 border-green-500/30"}`}>
                        <p className={`text-sm ${success === "Quote deleted!" ? "text-red-500" : "text-green-500"}`}>{success}</p>
                      </div>
                    )}

                    <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={loading}>
                      {loading ? "Creating..." : "Create Quote"}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Quotes List */}
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
                        {filteredQuotes.map((quote) => {
                          const monthlyCents = getMonthlyFromNotes(quote.notes);
                          const isAnnual = quote.plan_type === "annual";
                          const displayNotes = cleanNotes(quote.notes);
                          if (quote.paid) return (
                            <div key={quote.id} className="bg-card border border-green-500/20 rounded-xl p-4 opacity-75">
                              <div className="flex items-start justify-between gap-4"><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><h3 className="font-semibold truncate">{quote.name}</h3><span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">Paid</span></div><p className="text-sm text-muted-foreground truncate">{quote.email}</p>{quote.paid_at && <p className="text-xs text-muted-foreground mt-2">Paid: {formatDate(quote.paid_at)}</p>}</div><div className="text-right flex-shrink-0"><p className="text-xl font-bold text-green-500">{formatPrice(quote.price_cents)}</p><Button variant="ghost" size="sm" className="mt-2 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(quote.id)}><Trash2 className="w-4 h-4" /></Button></div></div>
                            </div>
                          );
                          return (
                            <div key={quote.id} className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors">
                              <div className="flex items-start justify-between gap-4"><div className="flex-1 min-w-0"><div className="flex items-center gap-2 mb-1"><h3 className="font-semibold truncate">{quote.name}</h3><span className={`text-xs px-2 py-0.5 rounded-full ${isAnnual ? "bg-cyan-500/10 text-cyan-400" : quote.plan_type === "monthly" ? "bg-violet-500/10 text-violet-400" : monthlyCents ? "bg-pink-400/10 text-pink-400" : "bg-red-400/10 text-red-400"}`}>{isAnnual ? "Annual" : quote.plan_type === "monthly" ? "Monthly" : monthlyCents ? "Hybrid" : "Upfront"}</span></div><p className="text-sm text-muted-foreground truncate">{quote.email}</p>{displayNotes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{displayNotes}</p>}<p className="text-xs text-muted-foreground mt-2">Created: {formatDate(quote.created_at)}</p></div><div className="text-right flex-shrink-0">{monthlyCents ? (<div><p className="text-base font-bold text-primary">{formatPrice(quote.price_cents)}</p><p className="text-xs text-muted-foreground">upfront</p><p className="text-base font-bold text-primary">+ {formatPrice(monthlyCents)}</p><p className="text-xs text-muted-foreground">/month</p></div>) : (<div><p className="text-xl font-bold text-primary">{formatPrice(quote.price_cents)}</p>{isAnnual ? <p className="text-xs text-muted-foreground">/year</p> : quote.plan_type === "monthly" ? <p className="text-xs text-muted-foreground">/month</p> : null}</div>)}<Button variant="ghost" size="sm" className="mt-2 text-red-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(quote.id)}><Trash2 className="w-4 h-4" /></Button></div></div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                {/* Pending Quotes */}
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-500" />
                    Pending Payment ({unpaidQuotes.length})
                  </h2>

                  {unpaidQuotes.length === 0 ? (
                    <div className="bg-card border border-border rounded-xl p-8 text-center">
                      <p className="text-muted-foreground">No pending quotes</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {unpaidQuotes.map((quote) => {
                        const monthlyCents = getMonthlyFromNotes(quote.notes);
                        const isAnnual = quote.plan_type === "annual";
                        const displayNotes = cleanNotes(quote.notes);
                        return (
                          <div
                            key={quote.id}
                            className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold truncate">{quote.name}</h3>
                                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                                    isAnnual
                                      ? "bg-cyan-500/10 text-cyan-400"
                                      : quote.plan_type === "monthly"
                                      ? "bg-violet-500/10 text-violet-400"
                                      : monthlyCents
                                      ? "bg-pink-400/10 text-pink-400"
                                      : "bg-red-400/10 text-red-400"
                                  }`}>
                                    {isAnnual ? "Annual" : quote.plan_type === "monthly" ? "Monthly" : monthlyCents ? "Hybrid" : "Upfront"}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground truncate">{quote.email}</p>
                                {displayNotes && (
                                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{displayNotes}</p>
                                )}
                                <p className="text-xs text-muted-foreground mt-2">
                                  Created: {formatDate(quote.created_at)}
                                </p>
                              </div>
                              <div className="text-right flex-shrink-0">
                                {monthlyCents ? (
                                  <div>
                                    <p className="text-base font-bold text-primary">{formatPrice(quote.price_cents)}</p>
                                    <p className="text-xs text-muted-foreground">upfront</p>
                                    <p className="text-base font-bold text-primary">+ {formatPrice(monthlyCents)}</p>
                                    <p className="text-xs text-muted-foreground">/month</p>
                                  </div>
                                ) : (
                                  <div>
                                    <p className="text-xl font-bold text-primary">{formatPrice(quote.price_cents)}</p>
                                    {isAnnual
                                      ? <p className="text-xs text-muted-foreground">/year</p>
                                      : quote.plan_type === "monthly"
                                      ? <p className="text-xs text-muted-foreground">/month</p>
                                      : null}
                                  </div>
                                )}
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="mt-2 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                  onClick={() => handleDelete(quote.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Paid Quotes */}
                {paidQuotes.length > 0 && (
                  <div>
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-500" />
                      Paid ({paidQuotes.length})
                    </h2>
                    <div className="space-y-3">
                      {paidQuotes.map((quote) => (
                        <div key={quote.id} className="bg-card border border-green-500/20 rounded-xl p-4 opacity-75">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold truncate">{quote.name}</h3>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">Paid</span>
                              </div>
                              <p className="text-sm text-muted-foreground truncate">{quote.email}</p>
                              {quote.paid_at && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Paid: {formatDate(quote.paid_at)}
                                </p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xl font-bold text-green-500">{formatPrice(quote.price_cents)}</p>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                onClick={() => handleDelete(quote.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
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
            {/* Ticket stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <button type="button" onClick={() => setTicketFilter(f => f === "open" ? "all" : "open")} className={`bg-card border rounded-xl p-6 text-left transition-colors hover:border-amber-500/50 ${ticketFilter === "open" ? "border-amber-500" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{openTickets.length}</p>
                    <p className="text-sm text-muted-foreground">Open</p>
                  </div>
                </div>
              </button>
              <button type="button" onClick={() => setTicketFilter(f => f === "in_progress" ? "all" : "in_progress")} className={`bg-card border rounded-xl p-6 text-left transition-colors hover:border-blue-500/50 ${ticketFilter === "in_progress" ? "border-blue-500" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                    <ChevronRight className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{inProgressTickets.length}</p>
                    <p className="text-sm text-muted-foreground">In Progress</p>
                  </div>
                </div>
              </button>
              <button type="button" onClick={() => setTicketFilter(f => f === "resolved" ? "all" : "resolved")} className={`bg-card border rounded-xl p-6 text-left transition-colors hover:border-green-500/50 ${ticketFilter === "resolved" ? "border-green-500" : "border-border"}`}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{resolvedTickets.length}</p>
                    <p className="text-sm text-muted-foreground">Resolved</p>
                  </div>
                </div>
              </button>
            </div>

            {filteredTickets.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-12 text-center">
                <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-40" />
                <p className="text-muted-foreground">No tickets found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTickets.map((ticket) => (
                  <div
                    key={ticket.id}
                    className={`bg-card border rounded-xl p-5 transition-colors ${
                      ticket.status === "resolved" ? "border-green-500/20 opacity-70" :
                      ticket.status === "in_progress" ? "border-blue-500/20" :
                      "border-amber-500/20"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-semibold">{ticket.subject}</h3>
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[ticket.status]}`}>
                            {statusLabel[ticket.status]}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {ticket.name} · {ticket.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatDate(ticket.created_at)}
                        </p>
                        <p className="text-sm mt-3 text-foreground/80 whitespace-pre-wrap">{ticket.description}</p>
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        {ticket.status !== "open" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs border-amber-500/40 text-amber-500 hover:bg-amber-500/10"
                            onClick={() => handleTicketStatus(ticket.id, "open")}
                          >
                            Open
                          </Button>
                        )}
                        {ticket.status !== "in_progress" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs border-blue-500/40 text-blue-500 hover:bg-blue-500/10"
                            onClick={() => handleTicketStatus(ticket.id, "in_progress")}
                          >
                            In Progress
                          </Button>
                        )}
                        {ticket.status !== "resolved" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs border-green-500/40 text-green-500 hover:bg-green-500/10"
                            onClick={() => handleTicketStatus(ticket.id, "resolved")}
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
