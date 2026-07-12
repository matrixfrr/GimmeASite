import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cfenv";

async function getSupabase() {
  const url = await getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = await getEnv("SUPABASE_SERVICE_ROLE_KEY");
  return { url, key };
}

// GET /api/preview?token=xxx — fetch preview record
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const { url, key } = await getSupabase();
  const res = await fetch(`${url}/rest/v1/site_previews?token=eq.${encodeURIComponent(token)}&limit=1`, {
    headers: { apikey: key!, Authorization: `Bearer ${key}` },
  });
  const rows = await res.json();
  if (!rows.length) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(rows[0]);
}

// POST /api/preview — create preview record (called from watcher)
export async function POST(request: Request) {
  const adminPassword = await getEnv("ADMIN_PASSWORD");
  const authHeader = request.headers.get("x-admin-key");
  if (authHeader !== adminPassword) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { token, email, name, company, video_url, payment_url } = body;
  if (!token || !email) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const { url, key } = await getSupabase();
  const res = await fetch(`${url}/rest/v1/site_previews`, {
    method: "POST",
    headers: {
      apikey: key!,
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ token, email, name, company, video_url, payment_url }),
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: 500 });
  }
  return NextResponse.json({ ok: true, token });
}
