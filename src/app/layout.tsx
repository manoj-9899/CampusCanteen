import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/components/AuthProvider";
import { Navbar } from "@/components/Navbar";
import { NetworkStatusBanner } from "@/components/NetworkStatusBanner";
import { PwaRegister } from "@/components/PwaRegister";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "CampusCanteen — Smart Canteen Ordering",
  description:
    "Inventory-aware college canteen ordering with digital payment, pickup tokens, and QR verification",
  icons: {
    icon: [{ url: "/icons/icon-192.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon-192.svg", type: "image/svg+xml" }],
  },
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "CampusCanteen",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: "#f97316",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-orange-50/40 font-sans text-slate-900">
        <AuthProvider>
          <PwaRegister />
          <Navbar />
          <NetworkStatusBanner />
          <main className="flex-1 overflow-x-hidden max-w-[100vw]">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
