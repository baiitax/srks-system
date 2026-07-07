import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import EnterprisePreloader from "@/components/EnterprisePreloader";

// Configure Inter with optimal display settings for Enterprise SaaS
const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Pluck Global Supply | Secure Operations Ledger",
  description: "Enterprise Tier-1 Logistics and Operations Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="antialiased">
      <body className="min-h-screen bg-slate-50 flex flex-col selection:bg-slate-900 selection:text-white">
        
        {/* System Boot Splash Screen */}
        <EnterprisePreloader />
        
        {/* Main Application Injector */}
        {children}
        
      </body>
    </html>
  );
}