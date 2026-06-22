import type { Metadata } from "next";
import "./globals.css";
import ClientBody from "./ClientBody";

export const metadata: Metadata = {
  title: "GimmeASite | Professional Web Design Agency",
  description: "Transform your business with stunning, professional websites that convert. Fast, affordable web design for businesses of all sizes. Get your free quote today!",
  keywords: "web design, website development, SEO, branding, professional websites",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "GimmeASite | Professional Web Design Agency",
    description: "Transform your business with stunning, professional websites that convert.",
    url: "https://gimmeasite.com",
    siteName: "GimmeASite",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
