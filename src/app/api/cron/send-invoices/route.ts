import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/cfenv";

export async function POST(request: Request) {
  const [cronSecret, stripeKey, supabaseUrl, supabaseServiceKey] = await Promise.all([
    getEnv("CRON_SECRET"),
    getEnv("STRIPE_SECRET_KEY"),
    getEnv("NEXT_PUBLIC_SUPABASE_URL"),
    getEnv("SUPABASE_SERVICE_ROLE_KEY"),
  ]);

  if (request.headers.get("x-cron-secret") !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stripe = new Stripe(stripeKey!);
  const supabaseAdmin = createClient(supabaseUrl!, supabaseServiceKey!);

  // Find tickets with a draft invoice that is due to be sent
  const { data: tickets, error } = await supabaseAdmin
    .from("tickets")
    .select("id, email, draft_invoice_id, invoice_scheduled_at")
    .not("draft_invoice_id", "is", null)
    .is("invoice_sent_at", null)
    .lte("invoice_scheduled_at", new Date().toISOString());

  if (error) {
    console.error("Cron: failed to query tickets:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  const sent: string[] = [];
  const failed: string[] = [];

  for (const ticket of tickets ?? []) {
    try {
      const finalized = await stripe.invoices.finalizeInvoice(ticket.draft_invoice_id);
      await stripe.invoices.sendInvoice(finalized.id);

      await supabaseAdmin
        .from("tickets")
        .update({ invoice_sent_at: new Date().toISOString() })
        .eq("id", ticket.id);

      sent.push(ticket.id);
      console.log(`Invoice sent for ticket ${ticket.id} (${ticket.email})`);
    } catch (err) {
      console.error(`Failed to send invoice for ticket ${ticket.id}:`, err);
      failed.push(ticket.id);
    }
  }

  return NextResponse.json({ sent, failed });
}
