#!/usr/bin/env tsx
/**
 * Sitemap Generator for Vite
 * 
 * Generates a sitemap.xml file for SEO purposes.
 * This script should be run before building for production.
 * 
 * Usage: pnpm run generate:sitemap
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface SitemapEntry {
  url: string;
  lastModified: Date;
  changeFrequency: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority: number;
}

// Base URL for the site
const BASE_URL = process.env.VITE_SITE_URL || "https://loctelli.com";

// Public routes that should be included in sitemap
const publicRoutes: SitemapEntry[] = [
  {
    url: `${BASE_URL}/`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 1.0,
  },
  {
    url: `${BASE_URL}/blog`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.5,
  },
  {
    url: `${BASE_URL}/auth/login`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.3,
  },
  {
    url: `${BASE_URL}/auth/register`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.3,
  },
];

function generateSitemapXML(entries: SitemapEntry[]): string {
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

  const urlEntries = entries
    .map((entry) => {
      const lastMod = entry.lastModified.toISOString().split("T")[0];
      return `  <url>
    <loc>${escapeXML(entry.url)}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>${entry.changeFrequency}</changefreq>
    <priority>${entry.priority.toFixed(1)}</priority>
  </url>`;
    })
    .join("\n");

  return `${xmlHeader}
${urlEntries}
</urlset>`;
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function main() {
  console.log("🗺️  Generating sitemap.xml...");
  console.log(`📍 Base URL: ${BASE_URL}`);

  const sitemapXML = generateSitemapXML(publicRoutes);
  const publicDir = path.join(__dirname, "..", "public");
  const sitemapPath = path.join(publicDir, "sitemap.xml");

  // Ensure public directory exists
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  // Write sitemap.xml
  fs.writeFileSync(sitemapPath, sitemapXML, "utf-8");

  console.log(`✅ Sitemap generated successfully: ${sitemapPath}`);
  console.log(`📊 Total URLs: ${publicRoutes.length}`);
}

// Always run when script is executed
main();

