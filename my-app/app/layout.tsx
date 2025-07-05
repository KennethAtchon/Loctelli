import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/contexts/auth-context";
import { AdminAuthProvider } from "@/contexts/admin-auth-context";
import { validateEnvironmentVariables } from "@/lib/envUtils";
import logger from '@/lib/logger';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Loctelli - AI-Powered Lead Generation & Qualification",
  description:
    "Automate your sales with AI-powered funnels. Loctelli creates ads, funnels leads into an AI chat system that qualifies and books meetings.",
  keywords:
    "AI infrastructure, lead generation, sales automation, AI chat, lead qualification",
};

// Validate environment variables on app startup
if (typeof window === 'undefined') {
  try {
    validateEnvironmentVariables();
    logger.debug('✅ Environment validation passed');
  } catch (error) {
    logger.error('❌ Environment validation failed:', error);
    // In development, we might want to show a more user-friendly error
    if (process.env.NODE_ENV === 'development') {
      logger.error('Please ensure API_KEY is set in your .env.local file');
    }
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <AdminAuthProvider>
              {children}
            </AdminAuthProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
