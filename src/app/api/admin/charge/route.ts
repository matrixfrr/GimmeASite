import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  try {
    const {
      adminPassword,
      ticketId,
      email,
      planType,
      amountCents,       // for one-time invoice charges (Transfer, Domain Change upfront)
      description,
      // for subscription plan users on domain change:
      newMonthlyCents,   // set to raise monthly amount (monthly/hybrid plans)
      newYearlyCents,    // set to raise yearly amount (annual plan)
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

    // ── Find or create Stripe customer by email ───────────────────────────────
    const customers = await stripe.customers.list({ email: email.toLowerCase(), limit: 1 });
    let customer = customers.data[0];
    if (!customer) {
      customer = await stripe.customers.create({ email: email.toLowerCase() });
    }

    const results: Record<string, unknown> = { customerId: customer.id };

    // ── One-time invoice (Transfer of Ownership, or Domain Change for upfront) ─
    if (amountCents && amountCents > 0) {
      await stripe.invoiceItems.create({
        customer: customer.id,
        amount: amountCents,
        currency: "usd",
        description: description || `GimmeASite — ${ticketId}`,
      });
      const invoice = await stripe.invoices.create({
        customer: customer.id,
        auto_advance: true,
        collection_method: "send_invoice",
        days_until_due: 7,
      });
      const finalized = await stripe.invoices.finalizeInvoice(invoice.id);
      await stripe.invoices.sendInvoice(finalized.id);
      results.invoiceId = finalized.id;
      results.invoiceUrl = finalized.hosted_invoice_url;

      // Record price on the ticket row
      await supabaseAdmin
        .from("tickets")
        .update({ custom_price: amountCents })
        .eq("id", ticketId);
    }

    // ── Subscription price update (Domain Change for monthly/hybrid/annual) ──
    if (newMonthlyCents || newYearlyCents) {
      const subscriptions = await stripe.subscriptions.list({
        customer: customer.id,
        status: "active",
        limit: 1,
      });
      const sub = subscriptions.data[0];
      if (!sub) {
        return NextResponse.json(
          { error: "No active subscription found for this customer", ...results },
          { status: 404 }
        );
      }

      const targetAmount = newMonthlyCents || newYearlyCents!;
      const interval = newYearlyCents ? "year" : "month";

      // Create a new price on the same product
      const existingPriceId = sub.items.data[0]?.price.id;
      const existingPrice = await stripe.prices.retrieve(existingPriceId);
      const newPrice = await stripe.prices.create({
        unit_amount: targetAmount,
        currency: "usd",
        recurring: { interval },
        product: existingPrice.product as string,
        nickname: `Domain change updated price — ticket ${ticketId}`,
      });

      // Update subscription to new price, prorated at next cycle
      await stripe.subscriptions.update(sub.id, {
        items: [{ id: sub.items.data[0].id, price: newPrice.id }],
        proration_behavior: "none",
      });

      results.subscriptionId = sub.id;
      results.newPriceId = newPrice.id;
      results.newAmount = targetAmount;

      await supabaseAdmin
        .from("tickets")
        .update({ custom_price: targetAmount })
        .eq("id", ticketId);
    }

    return NextResponse.json({ ok: true, ...results });
  } catch (err) {
    console.error("Admin charge error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
