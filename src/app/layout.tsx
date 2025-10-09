// src/app/layout.tsx

import type { Metadata } from "next";
import { Inter } from 'next/font/google'; // 1. Import the font
import "./globals.css";
import AuthProvider from "@/app/components/AuthProvider";
import { ThemeProvider } from "./components/ThemeProvider"; // 2. Import the ThemeProvider

// 3. Call the font function at the top level of the file (module scope)
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: `CortexCart Insight Dashboard v${process.env.NEXT_PUBLIC_APP_VERSION}`,
  description: "Your statistics dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
    
      <body className={`${inter.className} bg-white dark:bg-gray-900`}>
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}