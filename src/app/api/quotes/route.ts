import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET - Fetch all quotes or a specific quote by email
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (email) {
      // Fetch specific quote by email
      const { data, error } = await supabase
        .from("client_quotes")
        .select("*")
        .eq("email", email.toLowerCase())
        .eq("paid", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("Supabase error:", error);
        return NextResponse.json({ error: "Database error" }, { status: 500 });
      }

      return NextResponse.json({ quote: data || null });
    }

    // Fetch all quotes
    const { data, error } = await supabase
      .from("client_quotes")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ quotes: data });
  } catch (error) {
    console.error("Error fetching quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}

// POST - Create a new quote
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, name, plan_type, price_cents, notes, adminPassword } = body;

    // Verify admin password
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Validate required fields
    if (!email || !name || !plan_type || !price_cents) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (parseInt(price_cents) < 1) {
      return NextResponse.json(
        { error: "Price must be at least $0.01." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("client_quotes")
      .insert([
        {
          email: email.toLowerCase(),
          name,
          plan_type,
          price_cents: parseInt(price_cents),
          notes: notes || null,
          paid: false,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ quote: data });
  } catch (error) {
    console.error("Error creating quote:", error);
    return NextResponse.json(
      { error: "Failed to create quote" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a quote
export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { id, adminPassword } = body;

    // Verify admin password
    if (adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Missing quote ID" },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from("client_quotes")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting quote:", error);
    return NextResponse.json(
      { error: "Failed to delete quote" },
      { status: 500 }
    );
  }
}

// PATCH - Update a quote (mark as paid, etc.)
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, updates, adminPassword } = body;

    // For marking as paid, we don't need admin password (checkout does this)
    // For other updates, require admin password
    if (!updates.paid && adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!id) {
      return NextResponse.json(
        { error: "Missing quote ID" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("client_quotes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    return NextResponse.json({ quote: data });
  } catch (error) {
    console.error("Error updating quote:", error);
    return NextResponse.json(
      { error: "Failed to update quote" },
      { status: 500 }
    );
  }
}
