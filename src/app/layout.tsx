import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import ClientBody from "./ClientBody";

export const metadata: Metadata = {
  title: "GimmeASite",
  description: "Transform your business with stunning, professional websites that convert. Fast, affordable web design for businesses of all sizes. Get your free quote today!",
  keywords: "web design, website development, SEO, branding, professional websites",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
  openGraph: {
    title: "GimmeASite",
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
      <head>
        <Script id="apollo-tracker" strategy="afterInteractive">{`function initApollo(){var n=Math.random().toString(36).substring(7),o=document.createElement("script");o.src="https://assets.apollo.io/micro/website-tracker/tracker.iife.js?nocache="+n,o.async=!0,o.defer=!0,o.onload=function(){window.trackingFunctions.onLoad({appId:"6a341b62653152000cc7f0ff"})},document.head.appendChild(o)}initApollo();`}</Script>
      </head>
      <body className="antialiased">
        <ClientBody>{children}</ClientBody>
      </body>
    </html>
  );
}
