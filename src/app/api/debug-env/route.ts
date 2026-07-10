import { NextResponse } from "next/server";
import { getEnv } from "@/lib/cfenv";

export async function GET() {
  const adminPassword = await getEnv("ADMIN_PASSWORD");
  return NextResponse.json({
    ADMIN_PASSWORD: adminPassword ? `set (length=${adminPassword.length})` : "undefined",
  });
}
