import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Speed Test - Test Your Internet Connection",
  description: "Professional internet speed test with real-time download, upload, and ping testing. Multiple server locations and detailed results.",
  keywords: ["speed test", "internet speed", "download speed", "upload speed", "ping test", "network test"],
  authors: [{ name: "Speed Test Team" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Speed Test - Internet Connection Test",
    description: "Test your internet connection speed with professional tools",
    url: "https://speed-test-website.vercel.app",
    siteName: "Speed Test",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Speed Test - Internet Connection Test",
    description: "Test your internet connection speed with professional tools",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
