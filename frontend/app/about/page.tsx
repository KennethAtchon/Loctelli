import { Metadata } from "next";
import Link from "next/link";
import { BRANDING } from "@/lib/config/branding";
import { Navigation } from "@/components/version2/navigation";
import { Footer } from "@/components/version2/footer";

export const metadata: Metadata = {
  title: "About Us - Loctelli",
  description:
    "Learn about Loctelli: AI-powered marketing solutions for businesses. Free websites, Google reviews, customer reactivation, and lead generation.",
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      <main className="flex-1">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <header className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              About Us
            </h1>
            <p className="text-muted-foreground">
              {BRANDING.company.tagline}
            </p>
          </header>

          <div className="prose prose-gray max-w-none space-y-6 text-gray-700">
            <p>{BRANDING.company.description}</p>
            <p>
              We are based in {BRANDING.contact.address.short} and serve
              businesses looking to grow with AI-driven marketing tools. Our
              services include free professional websites, automated Google
              review systems, customer reactivation campaigns, and lead
              generation strategies.
            </p>
            <p>
              <Link
                href="/#contact"
                className="text-primary hover:underline font-medium"
              >
                Get in touch
              </Link>{" "}
              or{" "}
              <Link href="/#services" className="text-primary hover:underline font-medium">
                explore our services
              </Link>
              .
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
