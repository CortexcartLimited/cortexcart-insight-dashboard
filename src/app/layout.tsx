// src/app/layout.tsx

import type { Metadata, Viewport } from "next";
import { Inter } from 'next/font/google'; // 1. Import the font
import "./globals.css";
import AuthProvider from "@/app/components/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider"; // 2. Import the ThemeProvider

// 3. Call the font function at the top level of the file (module scope)
const inter = Inter({ subsets: ['latin'] });
export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: `CortexCart Insight Dashboard v${process.env.NEXT_PUBLIC_APP_VERSION}`,
  description: "Your statistics dashboard",
};

// --- FIX: Add Viewport Export ---
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevents zooming issues on inputs
};
// -------------------------------

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    
      <body className={`${inter.className} dark:bg-gray-900 bg-gray-100`}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}