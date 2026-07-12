import { notFound } from "next/navigation";
import Link from "next/link";
import { getEnv } from "@/lib/cfenv";

async function getPreview(token: string) {
  const url = await getEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = await getEnv("SUPABASE_SERVICE_ROLE_KEY");
  const res = await fetch(
    `${url}/rest/v1/site_previews?token=eq.${encodeURIComponent(token)}&limit=1`,
    { headers: { apikey: key!, Authorization: `Bearer ${key}` }, cache: "no-store" }
  );
  const rows = await res.json();
  return rows[0] ?? null;
}

export default async function PreviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const preview = await getPreview(token);
  if (!preview) notFound();

  const { video_url, payment_url } = preview;

  return (
    <main className="min-h-screen bg-background flex flex-col">

      {/* Header — matches billing page exactly */}
      <header className="w-full border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/favicon.svg" alt="GimmeASite" className="w-9 h-9" />
            <span className="font-bold text-xl tracking-tight">GimmeASite</span>
          </Link>
        </div>
      </header>

      {/* Center content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-8 gap-6">

        {/* Video */}
        <div className="w-full max-w-3xl rounded-xl overflow-hidden border border-border/50 bg-black aspect-video shadow-2xl">
          {video_url ? (
            <video
              src={video_url}
              controls
              autoPlay
              muted
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
              Video not available
            </div>
          )}
        </div>

        {/* What happens next */}
        <div className="flex items-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-[10px]">1</span>
            <span>Complete payment</span>
          </div>
          <span className="text-border">→</span>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-[10px]">2</span>
            <span>We connect your domain</span>
          </div>
          <span className="text-border">→</span>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center font-semibold text-[10px]">3</span>
            <span>Your site goes live</span>
          </div>
        </div>

        {/* CTA */}
        <a
          href={payment_url}
          className="inline-flex items-center justify-center h-12 px-10 rounded-lg bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-opacity"
        >
          Complete Payment →
        </a>

      </div>

      {/* Footer — matches billing page, "Design with passion" instead of copyright */}
      <footer className="border-t border-border/50 py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>Design with passion</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <a href="mailto:hello@gimmeasite.com" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>

    </main>
  );
}
