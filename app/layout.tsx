import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// Configure Inter with optimal display settings for Enterprise SaaS
const inter = Inter({ 
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Pluck Global | Enterprise Procurement",
  description: "Secure Procurement & Supply Record-Keeping System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} antialiased`}>
      <body className="font-sans bg-slate-50 text-slate-900 selection:bg-emerald-500/30">
        {children}
      </body>
    </html>
  );
}