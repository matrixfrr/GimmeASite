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
} from "lucide-react";

interface ClientQuote {
  id: string;
  email: string;
  name: string;
  plan_type: "one-time" | "monthly";
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

  // Form state
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    plan_type: "one-time" as "one-time" | "monthly",
    price: "",
    notes: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Verify password by making an authenticated request
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

      // Password verified - store it and fetch quotes
      setAdminPassword(password);
      setIsAuthenticated(true);

      // Now fetch the quotes
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
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          name: formData.name,
          plan_type: formData.plan_type,
          price_cents: Math.round(parseFloat(formData.price) * 100),
          notes: formData.notes,
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

  const formatPrice = (cents: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(cents / 100);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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
              <p className="text-muted-foreground mt-2">
                Enter your admin password to continue
              </p>
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

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90"
                disabled={loading}
              >
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
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg">GimmeASite Admin</h1>
              <p className="text-xs text-muted-foreground">
                Client Quote Management
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchQuotes}
              disabled={loading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsAuthenticated(false);
                setPassword("");
                setAdminPassword("");
              }}
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
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
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
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="bg-background"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Must match the email they&apos;ll use to pay
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Plan Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.plan_type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        plan_type: e.target.value as "one-time" | "monthly",
                      })
                    }
                    className="w-full h-11 rounded-lg border border-input bg-background px-4 py-2 text-sm"
                    required
                  >
                    <option value="one-time">Upfront</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Price (USD) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      $
                    </span>
                    <Input
                      type="number"
                      step="0.01"
                      min="1"
                      placeholder="1499.00"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: e.target.value })
                      }
                      className="bg-background pl-7"
                      required
                    />
                  </div>
                  {formData.plan_type === "monthly" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      This will be the recurring monthly charge
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Notes (optional)
                  </label>
                  <Textarea
                    placeholder="Project details, special requirements..."
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
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

                <Button
                  type="submit"
                  className="w-full bg-primary hover:bg-primary/90"
                  disabled={loading}
                >
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
                  {unpaidQuotes.map((quote) => (
                    <div
                      key={quote.id}
                      className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">
                              {quote.name}
                            </h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                quote.plan_type === "monthly"
                                  ? "bg-blue-500/10 text-blue-500"
                                  : "bg-purple-500/10 text-purple-500"
                              }`}
                            >
                              {quote.plan_type === "monthly"
                                ? "Monthly"
                                : "Upfront"}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {quote.email}
                          </p>
                          {quote.notes && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {quote.notes}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Created: {formatDate(quote.created_at)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl font-bold text-primary">
                            {formatPrice(quote.price_cents)}
                          </p>
                          {quote.plan_type === "monthly" && (
                            <p className="text-xs text-muted-foreground">
                              /month
                            </p>
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
                  ))}
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
                    <div
                      key={quote.id}
                      className="bg-card border border-green-500/20 rounded-xl p-4 opacity-75"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">
                              {quote.name}
                            </h3>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-500">
                              Paid
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {quote.email}
                          </p>
                          {quote.paid_at && (
                            <p className="text-xs text-muted-foreground mt-2">
                              Paid: {formatDate(quote.paid_at)}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-xl font-bold text-green-500">
                            {formatPrice(quote.price_cents)}
                          </p>
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
