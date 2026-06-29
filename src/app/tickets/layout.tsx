import type { Metadata } from "next";

export const metadata: Metadata = { title: "Submit a Ticket" };

export default function TicketsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
