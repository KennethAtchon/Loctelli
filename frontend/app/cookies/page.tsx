import { Metadata } from "next";
import Link from "next/link";
import { BRANDING } from "@/lib/config/branding";
import { Navigation } from "@/components/version2/navigation";
import { Footer } from "@/components/version2/footer";

export const metadata: Metadata = {
  title: "Cookie Policy - Loctelli",
  description:
    "Loctelli Cookie Policy: how we use cookies and similar technologies for authentication, security, and analytics on our CRM platform.",
};

export default function CookiePolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      <main className="flex-1">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <header className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Cookie Policy
            </h1>
            <p className="text-muted-foreground">
              Last updated: February 1, 2025
            </p>
          </header>

          <div className="prose prose-gray max-w-none space-y-10 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                1. Introduction
              </h2>
              <p>
                This Cookie Policy explains how {BRANDING.company.name},{" "}
                {BRANDING.company.legalStructure}, (“we,” “us,” or “our”) uses
                cookies and similar technologies when you use the Loctelli
                platform, including our website, applications, CRM, AI chat,
                lead management, booking, and SMS campaign services (the
                “Services”). It should be read together with our{" "}
                <Link
                  href={BRANDING.legal.privacy}
                  className="text-blue-600 hover:underline"
                >
                  Privacy Policy
                </Link>{" "}
                and{" "}
                <Link
                  href={BRANDING.legal.terms}
                  className="text-blue-600 hover:underline"
                >
                  Terms of Service
                </Link>
                . By using our Services, you consent to the use of cookies as
                described in this policy, except where your consent is required
                by law and you have not given it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                2. What Are Cookies and Similar Technologies?
              </h2>
              <p>
                <strong>Cookies</strong> are small text files that are placed on
                your device (computer, tablet, or mobile) when you visit a
                website or use an application. They are widely used to make
                services work more efficiently, to remember your preferences,
                and to recognize you across sessions.{" "}
                <strong>Similar technologies</strong> include local storage,
                session storage, and other identifiers that allow us or our
                partners to store or access information on your device.
              </p>
              <p>
                We use both <strong>first-party cookies</strong> (set by us on
                our domain) and may use <strong>third-party cookies</strong>
                (set by service providers we use, such as analytics or security
                providers) where necessary to operate and improve our Services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                3. How We Use Cookies and Similar Technologies
              </h2>
              <p>
                We use cookies and similar technologies for the following
                purposes:
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">
                3.1 Strictly Necessary (Essential)
              </h3>
              <p>
                These are required for the Services to function. They enable
                core features such as authentication, session management,
                security, and load balancing. Without these, you would not be
                able to log in, stay logged in, or use the platform securely.
                Our authentication system uses HTTP-only cookies to store and
                transmit tokens (e.g., JWT access and refresh tokens) in a
                secure manner. We do not use these cookies for marketing or
                non-essential tracking.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">
                3.2 Functional (Preference)
              </h3>
              <p>
                These allow us to remember your choices and preferences (e.g.,
                language, theme, or display settings) so that we can provide a
                more personalized experience. They may also support features
                such as form auto-fill or saved filters within the CRM.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">
                3.3 Performance and Analytics
              </h3>
              <p>
                We may use cookies and similar technologies to understand how
                visitors and users interact with our Services (e.g., which pages
                are visited, how long sessions last, and whether features are
                used). This helps us improve performance, fix errors, and
                optimize the user experience. Data is typically aggregated and
                may be shared with our analytics or monitoring providers under
                contract.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">
                3.4 Security and Fraud Prevention
              </h3>
              <p>
                We use cookies and related identifiers to help detect and
                prevent abuse, fraud, and unauthorized access. This includes
                supporting rate limiting, login attempt monitoring, and session
                validation in line with our security architecture (e.g., API key
                and JWT validation, role-based access control).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                4. Cookie Duration
              </h2>
              <p>
                <strong>Session cookies</strong> are temporary and are deleted
                when you close your browser. We use session-based storage for
                certain authentication and security purposes so that your
                session ends when you close the browser, unless you use
                “remember me” or similar features.{" "}
                <strong>Persistent cookies</strong> remain on your device for a
                set period (e.g., days or months) or until you delete them. For
                example, we may use persistent cookies for refresh tokens (with
                limited lifetime as described in our authentication
                documentation), theme preference, or analytics. The exact
                duration depends on the type of cookie and the purpose for which
                it is used.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                5. Third-Party Cookies and Integrations
              </h2>
              <p>
                When you use integrations (e.g., Calendly for booking, or other
                connected services), those third parties may set their own
                cookies or similar technologies on your device. We do not
                control third-party cookies. We encourage you to review the
                privacy and cookie policies of those services. For example,
                Calendly’s use of cookies and data is described in their{" "}
                <a
                  href={BRANDING.legal.calendly.privacy}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Privacy Policy
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                6. Your Choices
              </h2>
              <p>
                Most browsers allow you to manage cookies through their
                settings. You can typically block or delete cookies, or restrict
                them to first-party only. Please note that blocking or deleting
                strictly necessary cookies may prevent you from using parts of
                the Services (e.g., logging in or maintaining a session). If we
                use non-essential cookies that require your consent in your
                jurisdiction, we will obtain consent (e.g., via a banner or
                preference center) where required by law. You can change your
                consent choices at any time through the mechanism we provide or
                by adjusting your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                7. Updates
              </h2>
              <p>
                We may update this Cookie Policy from time to time to reflect
                changes in our practices, technology, or legal requirements. We
                will post the revised policy on this page and update the “Last
                updated” date. We encourage you to review this policy
                periodically.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                8. Contact
              </h2>
              <p>
                For questions about our use of cookies or this Cookie Policy,
                contact us at {BRANDING.contact.email} or at{" "}
                {BRANDING.contact.address.full}.
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
