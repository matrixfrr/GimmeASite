import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// The Stripe payment link ID for Revision Refills
// Derived from: https://account.gimmeasite.com/b/9B68wR9mG4602VQ0tB0co0g
const REVISION_REFILL_PAYMENT_LINK = process.env.REVISION_REFILL_PAYMENT_LINK_ID!;

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get("stripe-signature");

  if (!sig) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    // Only process Revision Refill payment link checkouts
    if (session.payment_link !== REVISION_REFILL_PAYMENT_LINK) {
      return NextResponse.json({ received: true });
    }

    const email =
      session.customer_details?.email ?? session.customer_email ?? null;

    if (!email) {
      console.error("No email on session:", session.id);
      return NextResponse.json({ error: "No email" }, { status: 400 });
    }

    // Retrieve line items to get quantity purchased
    const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
      limit: 1,
    });
    const quantity = lineItems.data[0]?.quantity ?? 1;

    // Increment revision_credits on the most recent paid quote for this email
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: quote, error: fetchErr } = await supabaseAdmin
      .from("client_quotes")
      .select("id, revision_credits")
      .eq("email", email.toLowerCase())
      .eq("paid", true)
      .order("paid_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchErr || !quote) {
      console.error("Quote not found for email:", email, fetchErr);
      return NextResponse.json({ error: "Quote not found" }, { status: 404 });
    }

    const newCredits = (quote.revision_credits ?? 0) + quantity;

    const { error: updateErr } = await supabaseAdmin
      .from("client_quotes")
      .update({ revision_credits: newCredits })
      .eq("id", quote.id);

    if (updateErr) {
      console.error("Failed to update revision_credits:", updateErr);
      return NextResponse.json({ error: "DB update failed" }, { status: 500 });
    }

    console.log(
      `Revision Refill: +${quantity} credits for ${email} (total: ${newCredits})`
    );
  }

  return NextResponse.json({ received: true });
}
