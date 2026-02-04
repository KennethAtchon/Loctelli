import { Metadata } from "next";
import Link from "next/link";
import { BRANDING } from "@/lib/config/branding";
import { Navigation } from "@/components/version2/navigation";
import { Footer } from "@/components/version2/footer";

export const metadata: Metadata = {
  title: "Case Studies - Loctelli",
  description:
    "Case studies: how Loctelli's AI marketing solutions drive results for businesses. Websites, reviews, reactivation, and lead gen.",
};

export default function CaseStudiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      <main className="flex-1">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <header className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Case Studies
            </h1>
            <p className="text-muted-foreground">
              Results and approaches from real projects
            </p>
          </header>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-700">
            <p>
              Our case studies show how we combine free websites, Google review
              automation, customer reactivation, and lead generation to deliver
              measurable outcomes. (Placeholder—add real case studies when
              available.)
            </p>

            <section className="border rounded-lg p-6 bg-white/60">
              <h2 className="text-xl font-semibold text-gray-900 mt-0">
                Case study: Lead generation campaign
              </h2>
              <p>
                Objective: Increase qualified leads for a B2B client. We used
                targeted landing pages, review collection, and follow-up
                automation. Outcome: Higher lead volume and better lead quality
                within one quarter.
              </p>
            </section>

            <section className="border rounded-lg p-6 bg-white/60">
              <h2 className="text-xl font-semibold text-gray-900 mt-0">
                Case study: Website + reviews
              </h2>
              <p>
                Objective: Improve local search visibility. We deployed a
                professional free website and automated Google review requests.
                Outcome: Improved rankings and more review volume, leading to
                more calls and form submissions.
              </p>
            </section>

            <p>
              <Link
                href="/#contact"
                className="text-primary hover:underline font-medium"
              >
                Contact us
              </Link>{" "}
              to discuss your situation and possible next steps.
            </p>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
