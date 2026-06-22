import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST - Verify quote by email or verify admin password
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Check if this is an admin password verification
    if (body.adminPassword !== undefined) {
      if (body.adminPassword !== process.env.ADMIN_PASSWORD) {
        return NextResponse.json({ error: "Unauthorized", success: false }, { status: 401 });
      }
      return NextResponse.json({ success: true });
    }

    // Otherwise, this is a quote email verification for checkout
    const { email, planType } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email address is required" },
        { status: 400 }
      );
    }

    // First, check if any unpaid quote exists for this email (regardless of plan type)
    const { data: anyQuote, error: anyQuoteError } = await supabase
      .from("client_quotes")
      .select("id, name, email, price_cents, plan_type, notes, created_at")
      .eq("email", email.toLowerCase())
      .eq("paid", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (anyQuoteError && anyQuoteError.code !== "PGRST116") {
      console.error("Database error:", anyQuoteError);
      return NextResponse.json(
        { error: "Database error. Please try again." },
        { status: 500 }
      );
    }

    // No quote found for this email at all
    if (!anyQuote) {
      return NextResponse.json(
        {
          found: false,
          reason: "not_found",
          message: "This email address is not recognized. Please contact us at hello@gimmeasite.com if you believe this is an error."
        },
        { status: 200 }
      );
    }

    // Quote found but plan type doesn't match
    if (planType && anyQuote.plan_type !== planType) {
      const expectedPlan = anyQuote.plan_type === "monthly" ? "Monthly Plan" : "Upfront Fee";
      return NextResponse.json(
        {
          found: false,
          reason: "plan_mismatch",
          expectedPlanType: anyQuote.plan_type,
          message: `Your quote is for the ${expectedPlan}. Please use the correct payment option or contact us at hello@gimmeasite.com.`
        },
        { status: 200 }
      );
    }

    // Quote found and plan type matches (or no plan type specified)
    return NextResponse.json({
      found: true,
      quote: {
        id: anyQuote.id,
        name: anyQuote.name,
        email: anyQuote.email,
        priceCents: anyQuote.price_cents,
        planType: anyQuote.plan_type,
        notes: anyQuote.notes,
      },
    });
  } catch (error) {
    console.error("Error in verify endpoint:", error);
    return NextResponse.json(
      { error: "Failed to verify", success: false },
      { status: 500 }
    );
  }
}
