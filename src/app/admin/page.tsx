"use client";

import { useState } from "react";
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
} from "lucide-react";

interface ClientQuote {
  id: string;
  email: string;
  name: string;
  plan_type: "one-time" | "monthly" | "upfront-monthly";
  price_cents: number;
  notes?: string;
  created_at: string;
  paid: boolean;
  paid_at?: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [quotes, setQuotes] = useState<ClientQuote[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    email: "",
    name: "",
    plan_type: "one-time" as "one-time" | "monthly" | "annual" | "upfront-monthly",
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
      if (data.quotes) {
        setQuotes(data.quotes);
      }
    } catch {
      setError("Failed to fetch quotes");
    } finally {
      setLoading(false);
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
        plan_type = "monthly";
        price_cents = Math.round(parseFloat(formData.price) * 100);
        if (price_cents < 2) {
          setError("Price must be at least $0.02.");
          setLoading(false);
          return;
        }
        notes = `[annual]${formData.notes ? ` ${formData.notes}` : ""}`;
      } else if (formData.plan_type === "upfront-monthly") {
        plan_type = "one-time";
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

  const isAnnualQuote = (notes?: string) => !!(notes?.includes("[annual]"));

  const cleanNotes = (notes?: string) =>
    notes?.replace(/\[monthly_cents:\d+\]\s*/g, "").replace(/\[annual\]\s*/g, "").trim() || "";

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

  const unpaidQuotes = quotes.filter((q) => !q.paid);
  const paidQuotes = quotes.filter((q) => q.paid);

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
              <p className="text-xs text-muted-foreground">Client Quote Management</p>
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
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{quotes.length}</p>
                <p className="text-sm text-muted-foreground">Total Quotes</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{unpaidQuotes.length}</p>
                <p className="text-sm text-muted-foreground">Pending Payment</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{paidQuotes.length}</p>
                <p className="text-sm text-muted-foreground">Paid</p>
              </div>
            </div>
          </div>
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
                        plan_type: e.target.value as "one-time" | "monthly" | "annual" | "upfront-monthly",
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
                    <option value="upfront-monthly">Upfront + Monthly</option>
                  </select>
                </div>

                {/* Price field */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Price (USD) <span className="text-red-500">*</span>
                  </label>
                  {formData.plan_type === "upfront-monthly" ? (
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
                  <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                    <p className="text-sm text-green-500">{success}</p>
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
                    const isAnnual = isAnnualQuote(quote.notes);
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
                                  ? "bg-blue-500/10 text-blue-500"
                                  : monthlyCents
                                  ? "bg-yellow-500/10 text-yellow-500"
                                  : "bg-purple-500/10 text-purple-500"
                              }`}>
                                {isAnnual ? "Annual" : quote.plan_type === "monthly" ? "Monthly" : monthlyCents ? "Upfront + Monthly" : "Upfront"}
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
          </div>
        </div>
      </main>
    </div>
  );
}
