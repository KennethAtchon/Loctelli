import { Metadata } from "next";
import Link from "next/link";
import { BRANDING } from "@/lib/config/branding";
import { Navigation } from "@/components/version2/navigation";
import { Footer } from "@/components/version2/footer";

export const metadata: Metadata = {
  title: "Success Stories - Loctelli",
  description:
    "Success stories from businesses that grew with Loctelli's AI marketing solutions: websites, reviews, reactivation, and lead generation.",
};

export default function SuccessStoriesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      <main className="flex-1">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <header className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Success Stories
            </h1>
            <p className="text-muted-foreground">
              How businesses grow with {BRANDING.company.name}
            </p>
          </header>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
            <p>
              We help local and regional businesses increase visibility, win back
              customers, and generate more leads using AI-powered tools. Here
              are a few examples (placeholder content—replace with real stories
              when ready).
            </p>

            <section className="border-l-4 border-primary/30 pl-6">
              <h2 className="text-xl font-semibold text-gray-900 mt-0">
                Local service business
              </h2>
              <p>
                A home-services company used our free website and Google review
                automation to improve their online presence. Within a few
                months, they saw more qualified leads and higher conversion from
                search.
              </p>
            </section>

            <section className="border-l-4 border-primary/30 pl-6">
              <h2 className="text-xl font-semibold text-gray-900 mt-0">
                Retail &amp; reactivation
              </h2>
              <p>
                A retail client used our customer reactivation campaigns to
                re-engage past customers. Open and click rates improved, and
                repeat purchases increased.
              </p>
            </section>

            <p>
              <Link href="/#contact" className="text-primary hover:underline font-medium">
                Tell us your goals
              </Link>{" "}
              and we can outline how we’d help.
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
