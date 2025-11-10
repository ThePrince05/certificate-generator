import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TemplateProvider } from "./context/TemplateContext";
import { OrganizationProvider } from "./context/OrganizationContext";
import QuickAccessPanel from "@/components/QuickAccessPanel";
import { DataProvider } from './context/DataContext';
import { Suspense } from 'react';

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

// Loading component for Suspense fallback
function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

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
          <DataProvider> 
            <TemplateProvider>
              {/* ✅ Docked Quick Access Panel */}
              <QuickAccessPanel />

              {/* ✅ Main App Content with Suspense boundary */}
              <Suspense fallback={<LoadingFallback />}>
                <main className="min-h-screen">{children}</main>
              </Suspense>
            </TemplateProvider>
          </DataProvider>
        </OrganizationProvider>
      </body>
    </html>
  );
}