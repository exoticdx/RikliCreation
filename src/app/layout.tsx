import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rikli Creation | Wholesale Catalogue",
  description: "Browse our exclusive collection of premium products at Rikli Creation.",
};

import ClientToaster from "@/components/ClientToaster";
import { STORE_CONFIG } from "@/config/store.config";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      style={{ '--theme-color': STORE_CONFIG.themeColor } as React.CSSProperties}
    >
      <body className="min-h-full flex flex-col">
        <ClientToaster />
        {children}
      </body>
    </html>
  );
}
