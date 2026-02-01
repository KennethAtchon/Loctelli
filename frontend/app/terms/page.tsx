import { Metadata } from "next";
import Link from "next/link";
import { BRANDING } from "@/lib/config/branding";
import { Navigation } from "@/components/version2/navigation";
import { Footer } from "@/components/version2/footer";

export const metadata: Metadata = {
  title: "Terms of Service - Loctelli",
  description:
    "Terms of Service for Loctelli: rules and conditions for using our CRM, AI chat, lead management, booking, and SMS campaign services.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      <main className="flex-1">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <header className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Terms of Service
            </h1>
            <p className="text-muted-foreground">
              Last updated: February 1, 2025
            </p>
          </header>

          <div className="prose prose-gray max-w-none space-y-10 text-gray-700">
            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                1. Agreement to Terms
              </h2>
              <p>
                These Terms of Service (“Terms”) govern your access to and use of
                the Loctelli platform, including our website, applications, CRM,
                AI-powered chat, lead management, sales strategies, booking and
                scheduling (including integration with Calendly), SMS campaigns,
                and related services (collectively, the “Services”) operated by{" "}
                {BRANDING.company.name}, {BRANDING.company.legalStructure}, (“we,” “us,” or “our”). By registering,
                logging in, or otherwise using the Services, you agree to be
                bound by these Terms. If you are using the Services on behalf of
                an organization, you represent that you have authority to bind
                that organization to these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                2. Description of Services
              </h2>
              <p>
                Loctelli provides a multi-tenant customer relationship
                management platform that includes:
              </p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Lead management, strategy assignment, and AI-powered
                  conversation and chat.
                </li>
                <li>
                  Booking and appointment scheduling, including integration with
                  third-party tools such as Calendly (subject to Calendly’s own
                  terms and policies).
                </li>
                <li>
                  SMS campaigns and messaging (e.g., via Twilio or other
                  providers), subject to applicable telecommunications and
                  consent rules.
                </li>
                <li>
                  Admin and user management, SubAccount (tenant) isolation, and
                  role-based access control.
                </li>
                <li>
                  Integrations with external services (e.g., GoHighLevel,
                  Calendly, Twilio), each subject to the third party’s terms and
                  privacy policies.
                </li>
              </ul>
              <p>
                We may add, change, or discontinue features from time to time.
                Material changes will be communicated as we deem appropriate
                (e.g., via the Services or email).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                3. Account Registration and Security
              </h2>
              <p>
                You must provide accurate and complete information when
                registering and keep your account information current. You are
                responsible for maintaining the confidentiality of your
                credentials and for all activity under your account. You must
                notify us promptly of any unauthorized access or use. We are not
                liable for losses arising from unauthorized use of your account
                due to your failure to safeguard your credentials.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                4. Acceptable Use
              </h2>
              <p>You agree not to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  Use the Services in violation of any applicable law or
                  regulation, or in a way that infringes the rights of others.
                </li>
                <li>
                  Use the Services to send spam, unsolicited messages, or
                  communications that violate anti-spam or telemarketing laws
                  (e.g., you must obtain appropriate consent for SMS and
                  marketing where required).
                </li>
                <li>
                  Attempt to gain unauthorized access to the Services, other
                  accounts, or our or any third party’s systems or data.
                </li>
                <li>
                  Interfere with or disrupt the integrity or performance of the
                  Services or any third-party systems connected to them.
                </li>
                <li>
                  Use the Services to distribute malware, phishing, or other
                  harmful or deceptive content.
                </li>
                <li>
                  Scrape, reverse-engineer, or attempt to extract source code or
                  underlying data from the Services except as expressly
                  permitted.
                </li>
                <li>
                  Use the AI chat or other features to generate or promote
                  illegal, harmful, or misleading content.
                </li>
              </ul>
              <p>
                We may suspend or terminate your access if we reasonably believe
                you have violated these Terms or applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                5. Your Data and Privacy
              </h2>
              <p>
                You retain ownership of the data you submit to the Services
                (“Your Data”). You grant us a limited license to use, store,
                and process Your Data as necessary to provide, improve, and
                secure the Services and as described in our{" "}
                <Link
                  href={BRANDING.legal.privacy}
                  className="text-blue-600 hover:underline"
                >
                  Privacy Policy
                </Link>
                . You are responsible for ensuring that Your Data and your use
                of the Services comply with applicable law and that you have
                necessary rights and consents (e.g., for leads, contacts, and
                SMS). We will handle Your Data in accordance with our Privacy
                Policy and applicable data processing agreements where
                applicable.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                6. Third-Party Services
              </h2>
              <p>
                The Services may integrate with or link to third-party services
                (e.g., Calendly for scheduling, Twilio for SMS, GoHighLevel).
                Your use of those services is subject to their respective
                terms and privacy policies. We are not responsible for
                third-party services. For booking-related data processed by
                Calendly, please review Calendly’s{" "}
                <a
                  href={BRANDING.legal.calendly.terms}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Terms of Use
                </a>{" "}
                and{" "}
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
                7. Intellectual Property
              </h2>
              <p>
                We own or license the Services, including the software,
                design, text, graphics, and other content we provide (excluding
                Your Data). These Terms do not grant you any right, title, or
                interest in our intellectual property except the limited right
                to use the Services in accordance with these Terms. You may not
                copy, modify, distribute, or create derivative works from our
                Services or content without our prior written consent.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                8. Disclaimers
              </h2>
              <p>
                THE SERVICES ARE PROVIDED “AS IS” AND “AS AVAILABLE” WITHOUT
                WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
                LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT
                THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF
                HARMFUL COMPONENTS. AI FEATURES (INCLUDING CHAT AND
                AUTOMATION) MAY PRODUCE INACCURATE OR INAPPROPRIATE OUTPUT;
                YOU ARE RESPONSIBLE FOR REVIEWING AND USING SUCH OUTPUT
                APPROPRIATELY.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                9. Limitation of Liability
              </h2>
              <p>
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, LOCTELLI AND
                ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL
                NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOSS OF PROFITS,
                DATA, OR GOODWILL, ARISING OUT OF OR RELATED TO THESE TERMS OR
                THE SERVICES, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
                DAMAGES. OUR TOTAL LIABILITY FOR ANY CLAIMS ARISING OUT OF OR
                RELATED TO THESE TERMS OR THE SERVICES SHALL NOT EXCEED THE
                AMOUNT YOU PAID US IN THE TWELVE (12) MONTHS PRECEDING THE
                CLAIM (OR ONE HUNDRED U.S. DOLLARS IF NO AMOUNT WAS PAID).
                SOME JURISDICTIONS DO NOT ALLOW CERTAIN LIMITATIONS; IN SUCH
                CASES, OUR LIABILITY WILL BE LIMITED TO THE MAXIMUM EXTENT
                PERMITTED BY LAW.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                10. Indemnification
              </h2>
              <p>
                You agree to indemnify, defend, and hold harmless Loctelli and
                its affiliates, officers, directors, employees, and agents from
                and against any claims, damages, losses, liabilities, costs,
                and expenses (including reasonable attorneys’ fees) arising out
                of or related to: (a) your use of the Services; (b) Your Data
                or your violation of any law or third-party rights; or (c) any
                breach of these Terms by you.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                11. Termination
              </h2>
              <p>
                We may suspend or terminate your access to the Services at any
                time, with or without cause or notice, including for violation
                of these Terms. You may stop using the Services at any time. Upon
                termination, your right to use the Services ceases immediately.
                Provisions that by their nature should survive (including
                Sections 5–10 and this sentence) will survive termination.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                12. General
              </h2>
              <p>
                These Terms constitute the entire agreement between you and
                Loctelli regarding the Services and supersede any prior
                agreements. Our failure to enforce any right or provision does
                not waive that right or provision. If any provision is held
                invalid, the remaining provisions remain in effect. We may assign
                these Terms; you may not assign without our prior written
                consent. These Terms are governed by the laws of the State of
                New York (or the jurisdiction specified in your agreement, if
                any), without regard to conflict of law principles.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                13. Contact
              </h2>
              <p>
                For questions about these Terms, contact us at{" "}
                {BRANDING.contact.email} or at {BRANDING.contact.address.full}.
              </p>
            </section>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
