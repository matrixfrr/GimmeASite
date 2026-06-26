import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (body.adminPassword !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find all legacy annual quotes (plan_type="monthly" with [annual] in notes)
    const { data: legacyRows, error: fetchError } = await supabase
      .from("client_quotes")
      .select("id, notes")
      .eq("plan_type", "monthly")
      .ilike("notes", "%[annual]%");

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!legacyRows || legacyRows.length === 0) {
      return NextResponse.json({ message: "No legacy annual quotes found.", updated: 0 });
    }

    let updated = 0;
    for (const row of legacyRows) {
      const cleanedNotes = (row.notes || "")
        .replace(/\[annual\]/gi, "")
        .trim();

      const { error: updateError } = await supabase
        .from("client_quotes")
        .update({ plan_type: "annual", notes: cleanedNotes || null })
        .eq("id", row.id);

      if (!updateError) updated++;
    }

    return NextResponse.json({
      message: `Fixed ${updated} of ${legacyRows.length} legacy annual quote(s).`,
      updated,
      total: legacyRows.length,
    });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
