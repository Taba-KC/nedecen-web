/**
 * The root wrapper Next.js applies to every browser route. It installs global styles,
 * document metadata and the shared HTML/body structure. Feature-specific bookshelf layout
 * belongs in the workspace components.
 */
import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NEDECEN",
  description: "Northern Education Development and Empowerment Centre",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <head>
        <meta name="theme-color" content="#1a1a1a" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
