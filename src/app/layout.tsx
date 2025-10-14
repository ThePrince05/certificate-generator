import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TemplateProvider } from "./context/TemplateContext";
import { OrganizationProvider } from "./context/OrganizationContext";
import QuickAccessPanel from "@/components/home/QuickAccessPanel"; // ✅ Import the panel

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Certificate Generator",
  description: "Generate personalized certificates quickly and easily.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50`}
      >
        <OrganizationProvider>
          <TemplateProvider>
            {/* ✅ Docked Quick Access Panel */}
            <QuickAccessPanel />

            {/* ✅ Main App Content */}
            <main className="min-h-screen">{children}</main>
          </TemplateProvider>
        </OrganizationProvider>
      </body>
    </html>
  );
}
