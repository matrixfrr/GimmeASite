import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { createClient } from "@supabase/supabase-js";

// Returns { allowed, used, limit, period } for revision tickets
async function checkRevisionLimit(email: string, planType: string): Promise<{
  allowed: boolean; used: number; limit: number | null; period: "total" | "monthly";
}> {
  // Annual = unlimited
  if (planType === "annual") return { allowed: true, used: 0, limit: null, period: "total" };

  let limit: number;
  let period: "total" | "monthly";

  if (planType === "one-time") {
    limit = 3;
    period = "total";
  } else if (planType === "monthly") {
    limit = 2;
    period = "monthly";
  } else if (planType === "hybrid") {
    limit = 4;
    period = "monthly";
  } else {
    // Unknown plan type — allow through
    return { allowed: true, used: 0, limit: null, period: "total" };
  }

  let query = supabase
    .from("tickets")
    .select("id", { count: "exact", head: true })
    .eq("email", email.toLowerCase())
    .eq("ticket_type", "revision");

  if (period === "monthly") {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    query = query.gte("created_at", startOfMonth);
  }

  const { count, error } = await query;
  if (error) return { allowed: true, used: 0, limit, period }; // fail open

  const used = count ?? 0;
  return { allowed: used < limit, used, limit, period };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const adminPassword = searchParams.get("adminPassword");
    const checkEmail = searchParams.get("checkRevisions");

    // Revision limit check (client-facing, no auth needed)
    if (checkEmail) {
      const { data: quote, error: qErr } = await supabase
        .from("client_quotes")
        .select("plan_type")
        .eq("email", checkEmail.toLowerCase())
        .eq("paid", true)
        .order("paid_at", { ascending: false })
        .limit(1)
        .single();

      if (qErr || !quote) {
        return NextResponse.json({ error: "Email not found" }, { status: 404 });
      }

      const result = await checkRevisionLimit(checkEmail, quote.plan_type);
      return NextResponse.json({ ...result, plan: quote.plan_type });
    }

    // Admin fetch
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
    let email: string, ticket_type: string, subject: string, description: string;
    let attachmentUrl: string | null = null;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      email = (formData.get("email") as string) || "";
      ticket_type = (formData.get("ticket_type") as string) || "revision";
      subject = (formData.get("subject") as string) || "";
      description = (formData.get("description") as string) || "";

      const file = formData.get("attachment") as File | null;
      if (file && file.size > 0) {
        const supabaseAdmin = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );
        const ext = file.name.split(".").pop() || "bin";
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const arrayBuffer = await file.arrayBuffer();
        const { error: uploadError } = await supabaseAdmin.storage
          .from("ticket-attachments")
          .upload(fileName, arrayBuffer, { contentType: file.type });

        if (!uploadError) {
          const { data: urlData } = supabaseAdmin.storage
            .from("ticket-attachments")
            .getPublicUrl(fileName);
          attachmentUrl = urlData?.publicUrl || null;
        }
      }
    } else {
      const body = await request.json();
      email = body.email || "";
      ticket_type = body.ticket_type || "revision";
      subject = body.subject || "";
      description = body.description || "";
    }

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

    // Enforce revision limit
    if (ticket_type === "revision") {
      const { allowed, used, limit, period } = await checkRevisionLimit(email, quote.plan_type);
      if (!allowed) {
        const periodLabel = period === "monthly" ? "this month" : "in total";
        return NextResponse.json(
          { error: `You have used all ${limit} of your revision${limit === 1 ? "" : "s"} ${periodLabel}. Please submit a Revision Refill ticket or contact us at hello@gimmeasite.com.`, revisionLimitReached: true, used, limit },
          { status: 403 }
        );
      }
    }

    const { data: ticket, error: ticketError } = await supabase
      .from("tickets")
      .insert([{
        quote_id: quote.id,
        email: email.toLowerCase(),
        name: quote.name,
        plan_type: quote.plan_type,
        ticket_type,
        subject: subject.trim(),
        description: description.trim(),
        attachment_url: attachmentUrl,
        status: "open",
      }])
      .select()
      .single();

    if (ticketError) {
      console.error("Ticket insert error:", ticketError);
      return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
    }

    return NextResponse.json({ ticket, name: quote.name });
  } catch (err) {
    console.error("Tickets POST error:", err);
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
