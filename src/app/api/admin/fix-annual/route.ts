import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getEnv } from "@/lib/cfenv";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const adminPassword = await getEnv("ADMIN_PASSWORD");
    if (body.adminPassword !== adminPassword) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = createClient(
      (await getEnv("NEXT_PUBLIC_SUPABASE_URL"))!,
      (await getEnv("SUPABASE_SERVICE_ROLE_KEY"))!
    );

    let totalUpdated = 0;

    // Fix 1: legacy annual rows (plan_type="monthly" + [annual] in notes) → plan_type="annual"
    const { data: legacyAnnual } = await supabase
      .from("client_quotes")
      .select("id, notes")
      .eq("plan_type", "monthly")
      .ilike("notes", "%[annual]%");

    for (const row of legacyAnnual || []) {
      const cleanedNotes = (row.notes || "").replace(/\[annual\]/gi, "").trim();
      await supabase.from("client_quotes").update({
        plan_type: "annual",
        notes: cleanedNotes || null,
      }).eq("id", row.id);
      totalUpdated++;
    }

    // Fix 2: legacy hybrid rows (plan_type="bundle") → plan_type="hybrid"
    const { data: legacyBundle } = await supabase
      .from("client_quotes")
      .select("id")
      .eq("plan_type", "bundle");

    for (const row of legacyBundle || []) {
      await supabase.from("client_quotes").update({ plan_type: "hybrid" }).eq("id", row.id);
      totalUpdated++;
    }

    return NextResponse.json({ message: `Auto-migration complete. ${totalUpdated} row(s) updated.`, updated: totalUpdated });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
