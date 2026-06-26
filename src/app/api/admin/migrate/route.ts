import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("key") !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Drop old constraint and recreate with 'annual' included
  const { error } = await supabase.rpc("exec_migrate_plan_type");

  if (error) {
    return NextResponse.json({
      error: error.message,
      hint: "Run this SQL manually in Supabase dashboard > SQL Editor:\n\nALTER TABLE client_quotes DROP CONSTRAINT IF EXISTS client_quotes_plan_type_check;\nALTER TABLE client_quotes ADD CONSTRAINT client_quotes_plan_type_check CHECK (plan_type IN ('one-time', 'monthly', 'annual'));",
    }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Migration complete — annual is now a valid plan_type." });
}
