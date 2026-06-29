import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminPassword = searchParams.get("adminPassword");

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ tickets: data });
  } catch {
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { email, subject, description } = await request.json();

    if (!email || !subject?.trim() || !description?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const { data: quote, error: quoteError } = await supabase
      .from("client_quotes")
      .select("id, name, email, plan_type")
      .eq("email", email.toLowerCase())
      .eq("paid", true)
      .order("paid_at", { ascending: false })
      .limit(1)
      .single();

    if (quoteError && quoteError.code !== "PGRST116") {
      console.error("Supabase error:", quoteError);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (!quote) {
      return NextResponse.json(
        { error: "No paid account found for this email. Please contact us at hello@gimmeasite.com if you believe this is an error." },
        { status: 404 }
      );
    }

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert([{
        quote_id: quote.id,
        email: email.toLowerCase(),
        name: quote.name,
        plan_type: quote.plan_type,
        subject: subject.trim(),
        description: description.trim(),
        status: "open",
      }])
      .select()
      .single();

    if (ticketError) {
      console.error("Ticket insert error:", ticketError);
      return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }

    return NextResponse.json({ ticket, name: quote.name });
  } catch {
    return NextResponse.json({ error: "Failed to submit ticket" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status, adminPassword } = await request.json();

    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("tickets")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ ticket: data });
  } catch {
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}
