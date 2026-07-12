import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cfenv";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const adminPassword = await getEnv("ADMIN_PASSWORD");
  if (searchParams.get("key") !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = await getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = await getEnv("SUPABASE_SERVICE_ROLE_KEY");

  // Create site_previews table via Supabase RPC
  const res = await fetch(`${url}/rest/v1/rpc/run_migration`, {
    method: "POST",
    headers: { apikey: key!, Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      sql: `CREATE TABLE IF NOT EXISTS site_previews (
        token TEXT PRIMARY KEY,
        email TEXT NOT NULL,
        name TEXT,
        company TEXT,
        video_url TEXT,
        payment_url TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
      );`
    }),
  });

  return NextResponse.json({
    message: "Run this SQL in Supabase Dashboard → SQL Editor",
    sql: `CREATE TABLE IF NOT EXISTS site_previews (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  company TEXT,
  video_url TEXT,
  payment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);`
  });
}
