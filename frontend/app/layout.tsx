import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { UnifiedAuthProvider } from "@/contexts/unified-auth-context";
import { Providers } from "@/components/providers";
import { validateEnvironmentVariables, ENV_CONFIG } from "@/lib/utils/envUtils";
import logger from "@/lib/logger";
import { Toaster } from "@/components/ui/sonner";
import { DebugPanel } from "@/components/debug/debug-panel";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Loctelli - AI-Powered Lead Generation & Qualification",
  description:
    "Automate your sales with AI-powered funnels. Loctelli creates ads, funnels leads into an AI chat system that qualifies and books meetings.",
  keywords:
    "AI infrastructure, lead generation, sales automation, AI chat, lead qualification",

  // Add missing elements
  metadataBase: new URL("https://loctelli.com"),
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
  },

  // Open Graph
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://loctelli.com",
    title: "Loctelli - AI-Powered Lead Generation & Qualification",
    description:
      "Automate your sales with AI-powered funnels. Triple your revenue with professional websites, automated reviews, and AI-driven lead generation.",
    siteName: "Loctelli",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Loctelli AI Marketing Platform",
      },
    ],
  },

  // Twitter
  twitter: {
    card: "summary_large_image",
    title: "Loctelli - AI-Powered Lead Generation",
    description: "Triple your revenue with AI marketing automation",
    images: ["/twitter-image.png"],
  },
  icons: {
    icon: "/favicon.ico",
  },
};

// Validate environment variables on app startup
if (typeof window === "undefined") {
  try {
    validateEnvironmentVariables();
    logger.debug("✅ Environment validation passed");
  } catch (error) {
    logger.error("❌ Environment validation failed:", error);
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <UnifiedAuthProvider>{children}</UnifiedAuthProvider>
            <Toaster />
            {ENV_CONFIG.DEBUG && <DebugPanel />}
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
