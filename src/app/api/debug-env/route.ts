import { NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET() {
  let cfResult: string;
  let envKeys: string[] = [];
  try {
    const { env } = await getCloudflareContext({ async: true });
    envKeys = Object.keys(env as object);
    const pw = (env as Record<string, string>)["ADMIN_PASSWORD"];
    cfResult = pw ? `set (length=${pw.length})` : "key not found in env";
  } catch (e) {
    cfResult = `getCloudflareContext threw: ${String(e)}`;
  }
  return NextResponse.json({
    ADMIN_PASSWORD: cfResult,
    process_env_set: !!process.env.ADMIN_PASSWORD,
    cf_env_keys: envKeys,
  });
}
