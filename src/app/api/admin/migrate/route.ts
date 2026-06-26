import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("key") !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    message: "Run the following SQL in Supabase Dashboard → SQL Editor:",
    sql: [
      "-- 1. Drop the old plan_type constraint",
      "ALTER TABLE client_quotes DROP CONSTRAINT IF EXISTS client_quotes_plan_type_check;",
      "",
      "-- 2. Rename old upfront-monthly rows (stored as one-time+notes) to bundle",
      "UPDATE client_quotes SET plan_type = 'bundle' WHERE plan_type = 'one-time' AND notes LIKE '[monthly_cents:%';",
      "",
      "-- 3. Add updated constraint",
      "ALTER TABLE client_quotes ADD CONSTRAINT client_quotes_plan_type_check CHECK (plan_type IN ('one-time', 'monthly', 'annual', 'bundle'));",
    ].join("\n"),
  });
}
