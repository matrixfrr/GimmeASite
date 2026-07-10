import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const TICKET_TYPE_LABELS: Record<string, string> = {
  transfer_ownership: "Transfer of Ownership",
  domain_change: "Domain Change",
};

export async function POST(request: Request) {
  try {
    const {
      adminPassword, ticketId, email, planType,
      amountCents, ticketType,
      newMonthlyCents, newYearlyCents,
    } = await request.json();

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!email || !ticketId) {
      return NextResponse.json({ error: "email and ticketId are required" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ── Find or create Stripe customer ────────────────────────────────────────
    const customers = await stripe.customers.list({ email: email.toLowerCase(), limit: 1 });
    let customer = customers.data[0];
    if (!customer) {
      customer = await stripe.customers.create({ email: email.toLowerCase() });
    }

    const results: Record<string, unknown> = { customerId: customer.id };

    // ── One-time DRAFT invoice (Transfer, or Domain Change for upfront) ───────
    if (amountCents && amountCents > 0) {
      const label = TICKET_TYPE_LABELS[ticketType] ?? "GimmeASite Service";

      await stripe.invoiceItems.create({
        customer: customer.id,
        amount: amountCents,
        currency: "usd",
        description: label,
      });

      // Create as draft — do NOT finalize or send yet
      const invoice = await stripe.invoices.create({
        customer: customer.id,
        auto_advance: false,   // stays draft
        collection_method: "send_invoice",
        days_until_due: 7,
        description: label,
        // memo shown on the Stripe-hosted payment page
        footer: "Thank you for choosing GimmeASite.",
      });

      // Schedule send time = ticket created_at + 3 days
      const { data: ticket } = await supabaseAdmin
        .from("tickets")
        .select("created_at")
        .eq("id", ticketId)
        .single();

      const scheduledAt = ticket
        ? new Date(new Date(ticket.created_at).getTime() + 3 * 86400000).toISOString()
        : new Date(Date.now() + 3 * 86400000).toISOString();

      await supabaseAdmin
        .from("tickets")
        .update({
          custom_price: amountCents,
          draft_invoice_id: invoice.id,
          invoice_scheduled_at: scheduledAt,
        })
        .eq("id", ticketId);

      results.draftInvoiceId = invoice.id;
      results.scheduledAt = scheduledAt;
    }

    // ── Subscription price update (Domain Change for subscribers) ─────────────
    // Immediate — no invoice scheduling needed
    if (newMonthlyCents || newYearlyCents) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 1,
      });
      const sub = subscriptions.data[0];
      if (!sub) {
        return NextResponse.json({ error: "No active subscription found for this customer", ...results }, { status: 404 });
      }

      const targetAmount = newMonthlyCents || newYearlyCents!;
      const interval = newYearlyCents ? "year" : "month";
      const existingPrice = await stripe.prices.retrieve(sub.items.data[0]?.price.id);
      const newPrice = await stripe.prices.create({
        unit_amount: targetAmount,
        currency: "usd",
        recurring: { interval },
        product: existingPrice.product as string,
        nickname: `Domain change — ticket ${ticketId}`,
      });

      await stripe.subscriptions.update(sub.id, {
        items: [{ id: sub.items.data[0].id, price: newPrice.id }],
        proration_behavior: "none",
      });

      await supabaseAdmin
        .from("tickets")
        .update({ custom_price: targetAmount })
        .eq("id", ticketId);

      // Queue confirmation email via watcher KV
      const { data: ticketRow } = await supabaseAdmin
        .from("tickets")
        .select("name")
        .eq("id", ticketId)
        .single();
      const firstName = (ticketRow?.name as string | null)?.split(" ")[0] || "there";
      const newAmountDollars = (targetAmount / 100).toFixed(2);

      await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/storage/kv/namespaces/${process.env.CF_KV_NAMESPACE_ID}/values/${encodeURIComponent(`pending_domain_change_sub_email:${email}`)}`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${process.env.CF_API_TOKEN}` },
          body: JSON.stringify({ email, first_name: firstName, new_amount: newAmountDollars, interval }),
        }
      );

      results.subscriptionId = sub.id;
      results.newPriceId = newPrice.id;
      results.newAmount = targetAmount;
    }

    return NextResponse.json({ ok: true, ...results });
  } catch (err) {
    console.error("Admin charge error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
