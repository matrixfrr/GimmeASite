import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function getEnv(key: string): Promise<string | undefined> {
  const fromProcess = process.env[key];
  if (fromProcess) return fromProcess;
  try {
    const { env } = await getCloudflareContext({ async: true });
    return (env as unknown as Record<string, string>)[key];
  } catch {
    return undefined;
  }
}
