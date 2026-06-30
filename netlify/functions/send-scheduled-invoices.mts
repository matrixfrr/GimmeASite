// Netlify scheduled function — runs every hour
// Triggers the send-invoices cron endpoint to dispatch any due invoices

export default async function sendScheduledInvoices() {
  const baseUrl = process.env.URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/cron/send-invoices`, {
    method: "POST",
    headers: { "x-cron-secret": process.env.CRON_SECRET ?? "" },
  });
  const body = await res.json();
  console.log("send-invoices result:", JSON.stringify(body));
  return new Response(JSON.stringify(body), { status: 200 });
}

export const config = {
  schedule: "@hourly",
};
