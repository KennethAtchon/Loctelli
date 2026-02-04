import { Metadata } from "next";
import Link from "next/link";
import { BRANDING } from "@/lib/config/branding";
import { Navigation } from "@/components/version2/navigation";
import { Footer } from "@/components/version2/footer";

export const metadata: Metadata = {
  title: "Resources - Loctelli",
  description:
    "Resources from Loctelli: guides and links for AI marketing, websites, Google reviews, and lead generation.",
};

export default function ResourcesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      <main className="flex-1">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <header className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Resources
            </h1>
            <p className="text-muted-foreground">
              Guides and useful links from {BRANDING.company.name}
            </p>
          </header>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <p>
              Placeholder resource hub. Add blog posts, guides, and tools here
              as you create them.
            </p>

            <ul className="list-disc pl-6 space-y-2">
              <li>
                <Link
                  href="/#services"
                  className="text-primary hover:underline"
                >
                  Our services
                </Link>{" "}
                — Free websites, Google reviews, reactivation, lead generation
              </li>
              <li>
                <Link href="/about" className="text-primary hover:underline">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/#contact" className="text-primary hover:underline">
                  Contact
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-primary hover:underline">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-primary hover:underline">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-primary hover:underline">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
