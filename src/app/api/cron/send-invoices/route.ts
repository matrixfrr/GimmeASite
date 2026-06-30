import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: Request) {
  // Verify cron secret to prevent unauthorized calls
  if (request.headers.get("x-cron-secret") !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

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
