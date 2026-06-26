import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  if (searchParams.get("key") !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    message: "Run the following SQL in Supabase Dashboard → SQL Editor:",
    sql: [
      "-- 1. Convert plan_type to TEXT in case it is a Postgres enum",
      "ALTER TABLE client_quotes ALTER COLUMN plan_type TYPE TEXT;",
      "",
      "-- 2. Drop any existing CHECK constraint on plan_type",
      "ALTER TABLE client_quotes DROP CONSTRAINT IF EXISTS client_quotes_plan_type_check;",
      "",
      "-- 3. Migrate legacy bundle rows to hybrid",
      "UPDATE client_quotes SET plan_type = \'hybrid\' WHERE plan_type = \'bundle\';",
      "UPDATE client_quotes SET plan_type = \'hybrid\' WHERE plan_type = \'one-time\' AND notes LIKE \'[monthly_cents:%\';",
      "",
      "-- 4. Migrate legacy annual rows (plan_type=monthly + [annual] in notes)",
      "UPDATE client_quotes SET plan_type = \'annual\', notes = TRIM(REPLACE(notes, \'[annual]\', \'\')) WHERE plan_type = \'monthly\' AND notes ILIKE \'%[annual]%\';",
      "",
      "-- 5. Add updated CHECK constraint",
      "ALTER TABLE client_quotes ADD CONSTRAINT client_quotes_plan_type_check CHECK (plan_type IN (\'one-time\', \'monthly\', \'annual\', \'hybrid\'));",
    ].join("\n"),
  });
}
