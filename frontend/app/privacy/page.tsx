import { Metadata } from "next";
import Link from "next/link";
import { BRANDING } from "@/lib/config/branding";
import { Navigation } from "@/components/version2/navigation";
import { Footer } from "@/components/version2/footer";

export const metadata: Metadata = {
  title: "Privacy Policy - Loctelli",
  description:
    "Loctelli Privacy Policy: how we collect, use, and protect your data, including SMS and text campaigns. Consent, opt-out, and compliance with TCPA and carrier requirements.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Navigation />
      <main className="flex-1">
        <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <header className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-4">
              Privacy Policy
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
                {BRANDING.company.name}, {BRANDING.company.legalStructure},
                (“we,” “us,” or “our”) operates the Loctelli platform, a
                multi-tenant customer relationship management (CRM) system that
                provides AI-powered lead generation, sales strategies, booking
                and scheduling (including via Calendly), AI chat,{" "}
                <strong>SMS and text message campaigns</strong>, and related
                marketing and sales automation services (the “Services”). This
                Privacy Policy explains how we collect, use, disclose, and
                safeguard your information when you use our website,
                applications, and Services. We send SMS and text messages only
                with prior express written consent and honor opt-out requests
                promptly; see Section 3A for full details. By using Loctelli,
                you agree to the practices described in this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                2. Information We Collect
              </h2>
              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">
                2.1 Information You Provide
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Account and profile data:</strong> Name, email
                  address, password (stored in hashed form), role (e.g., admin,
                  user, manager), and any profile or business information you
                  provide when registering or managing your account.
                </li>
                <li>
                  <strong>Lead and contact data:</strong> Information about
                  leads and contacts that you or your organization enters into
                  the CRM, including names, contact details, communication
                  history, and notes, in connection with our lead management and
                  strategy features.
                </li>
                <li>
                  <strong>Conversation and chat data:</strong> Messages sent and
                  received through our AI-powered chat, including summaries and
                  context used to provide and improve our chat and automation
                  services.
                </li>
                <li>
                  <strong>Booking and calendar data:</strong> Appointment
                  details, availability, and related information used for our
                  booking system and for integration with third-party scheduling
                  tools such as Calendly.
                </li>
                <li>
                  <strong>SMS and text messaging data:</strong> When you or your
                  contacts opt in to SMS or text campaigns, we collect and
                  process mobile phone numbers, message content, delivery and
                  read status, opt-in/opt-out timestamps, and campaign settings.
                  This data is used solely to deliver messages you have
                  authorized, to honor opt-out requests, and to comply with
                  applicable telephony and messaging laws (e.g., TCPA, CTIA, and
                  carrier requirements). We do not sell or share phone numbers
                  with third parties for their marketing. SMS delivery is
                  provided through trusted providers (e.g., Twilio) under
                  contract for the sole purpose of sending and tracking messages
                  on our behalf.
                </li>
                <li>
                  <strong>Support and communications:</strong> Any information
                  you provide when contacting us for support or feedback.
                </li>
              </ul>
              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">
                2.2 Information Collected Automatically
              </h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Usage and logs:</strong> IP address, browser type,
                  device information, pages visited, and general usage patterns
                  when you access our Services.
                </li>
                <li>
                  <strong>Cookies and similar technologies:</strong> We use
                  cookies and similar technologies for authentication, session
                  management, security, and analytics. For details, see our{" "}
                  <Link
                    href={BRANDING.legal.cookies}
                    className="text-blue-600 hover:underline"
                  >
                    Cookie Policy
                  </Link>
                  .
                </li>
              </ul>
              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">
                2.3 Multi-Tenant and SubAccount Data
              </h3>
              <p>
                Our platform is multi-tenant. Data is isolated by SubAccount
                (organization). We process and store data in a way that keeps
                each organization’s data separate and accessible only in
                accordance with your role and our security and access controls.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                3. How We Use Your Information
              </h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>Provide, operate, and maintain the Loctelli Services.</li>
                <li>
                  Authenticate users and enforce security (e.g., JWT tokens,
                  rate limiting, access control).
                </li>
                <li>
                  Power AI chat, lead management, strategies, booking, and SMS
                  campaigns, including storing and processing conversation and
                  lead data.
                </li>
                <li>
                  <strong>SMS and text messaging:</strong> Send SMS and text
                  messages only to individuals who have given prior express
                  written consent (or where otherwise permitted by law). We
                  honor opt-out requests promptly, maintain consent and opt-out
                  records for compliance, and do not use phone numbers for
                  marketing beyond the scope of consent received.
                </li>
                <li>
                  Improve our Services, including AI models and automation, in
                  accordance with our internal policies and agreements.
                </li>
                <li>
                  Send you service-related communications, security alerts, and
                  (where permitted) marketing or product updates.
                </li>
                <li>
                  Comply with legal obligations, resolve disputes, and enforce
                  our agreements.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                3A. SMS and Text Messaging (Campaigns and Notifications)
              </h2>
              <p>
                Loctelli supports SMS and text message campaigns and
                notifications. We are committed to compliance with the Telephone
                Consumer Protection Act (TCPA), CTIA guidelines, carrier
                requirements (including A2P 10DLC where applicable), and other
                applicable telephony and messaging laws. The following applies
                to SMS and text messaging conducted through our platform.
              </p>
              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">
                Consent
              </h3>
              <p>
                We send marketing or promotional SMS and text messages only to
                individuals who have given{" "}
                <strong>prior express written consent</strong> (or where
                otherwise permitted by law, e.g., transactional messages).
                Consent is obtained before any marketing messages are sent.
                Consent is not required as a condition of purchasing any good or
                service. We document and retain evidence of consent (e.g.,
                timestamp, source, scope) for compliance and audit purposes.
              </p>
              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">
                What You Can Expect
              </h3>
              <p>
                Message frequency varies by campaign and preference; we do not
                send an unreasonable volume of messages. Messages may include
                marketing, promotions, appointment reminders, and
                service-related notifications, consistent with the consent you
                provided. Message and data rates may apply depending on your
                carrier and plan.
              </p>
              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">
                How to Opt Out (Unsubscribe)
              </h3>
              <p>
                You may opt out of SMS and text messages at any time. To
                unsubscribe: (1) reply <strong>STOP</strong> (or
                <strong> UNSUBSCRIBE</strong> or <strong>END</strong>) to any
                message you receive from us, or (2) contact us at{" "}
                {BRANDING.contact.email} or {BRANDING.contact.phone.display} and
                request to be removed from SMS campaigns. We will process
                opt-out requests promptly and will not send further marketing
                messages to that number after opt-out, except as required by law
                (e.g., a single confirmation that opt-out was received). You may
                receive a final confirmation message that you have been
                unsubscribed.
              </p>
              <h3 className="text-lg font-medium text-gray-900 mt-6 mb-2">
                Help and Support
              </h3>
              <p>
                For help, reply <strong>HELP</strong> to any message or contact
                us at {BRANDING.contact.email}. We do not sell or share your
                phone number with third parties for their marketing. Phone
                numbers and related SMS data are used only to deliver messages
                you have authorized, to honor opt-outs, and to comply with
                applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                4. Sharing and Disclosure
              </h2>
              <p>We may share your information:</p>
              <ul className="list-disc pl-6 space-y-2">
                <li>
                  <strong>Within your organization:</strong> With other users
                  and admins in your SubAccount, as permitted by your role and
                  our access controls.
                </li>
                <li>
                  <strong>Service providers:</strong> With vendors that help us
                  run our platform (e.g., hosting, database, caching, email, SMS
                  delivery and compliance, AI, and analytics). Our SMS
                  provider(s) receive only the data necessary to deliver
                  messages and report delivery status; they are contractually
                  bound to use data only to provide services to us and to
                  protect your information. We do not sell or share phone
                  numbers with third parties for their marketing.
                </li>
                <li>
                  <strong>Integrations:</strong> When you use integrations
                  (e.g., Calendly for booking, Twilio for SMS, or other
                  connected services), the relevant data may be shared with
                  those third-party services in accordance with their privacy
                  policies. We encourage you to review Calendly’s{" "}
                  <a
                    href={BRANDING.legal.calendly.privacy}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Privacy Policy
                  </a>{" "}
                  and the policies of any other services you connect.
                </li>
                <li>
                  <strong>Legal and safety:</strong> When required by law, to
                  protect our rights or the safety of users, or in connection
                  with a merger, sale, or other corporate transaction (with
                  appropriate confidentiality and use restrictions).
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                5. Data Retention and Security
              </h2>
              <p>
                We retain your information for as long as your account is active
                or as needed to provide the Services, comply with law, resolve
                disputes, and enforce our agreements. For SMS and text
                messaging, we retain consent and opt-out records, message logs,
                and related data as required for compliance with TCPA, carrier,
                and regulatory requirements (typically for a period that allows
                us to demonstrate consent and honor opt-outs). We implement
                technical and organizational measures (including encryption,
                access controls, and secure development practices) to protect
                your data against unauthorized access, loss, or misuse.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                6. Your Rights and Choices
              </h2>
              <p>
                Depending on your location, you may have rights to access,
                correct, delete, or restrict processing of your personal data,
                or to data portability and to object to or withdraw consent from
                certain processing. To exercise these rights, contact us at{" "}
                {BRANDING.contact.email}. We will respond in accordance with
                applicable law. You may also have the right to lodge a complaint
                with a supervisory authority.
              </p>
              <p className="mt-4">
                <strong>SMS and text messaging:</strong> You may opt out of
                marketing SMS and text messages at any time by replying STOP (or
                UNSUBSCRIBE or END) to any message or by contacting us at{" "}
                {BRANDING.contact.email}. We will process your opt-out promptly
                and will not send further marketing messages to that number.
                Withdrawing consent for SMS does not affect your other rights
                under this policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                7. International Transfers
              </h2>
              <p>
                Your information may be processed in the United States or other
                countries where we or our service providers operate. We take
                steps to ensure that such transfers are subject to appropriate
                safeguards where required by applicable law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                8. Children’s Privacy
              </h2>
              <p>
                Our Services are not directed to individuals under 16. We do not
                knowingly collect personal information from children under 16.
                If you believe we have collected such information, please
                contact us and we will take steps to delete it.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                9. Changes to This Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time. We will
                post the revised policy on this page and update the “Last
                updated” date. Continued use of the Services after changes
                constitutes acceptance of the updated policy. For material
                changes, we may provide additional notice as required by law.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">
                10. Contact Us
              </h2>
              <p>
                For questions about this Privacy Policy or our data practices,
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
