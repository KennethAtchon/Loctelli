import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AdminAuthProvider } from "@/contexts/admin-auth-context";
import { validateEnvironmentVariables } from "@/lib/utils/envUtils";
import logger from '@/lib/logger';
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Website Builder - AI-Powered Website Editor",
  description:
    "Upload your website and edit it with AI. Change colors, text, layout - all through natural language commands. Live preview of changes as you type.",
  keywords:
    "AI website editor, website builder, AI code editing, live preview, natural language editing",
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
            <AdminAuthProvider>
              {children}
            </AdminAuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
