import { createFileRoute } from '@tanstack/react-router';
import { Helmet } from 'react-helmet-async';
import { HeroSection } from '@/components/version2/hero-section';
import { ServicesSection } from '@/components/version2/services-section';
import { ProcessSection } from '@/components/version2/process-section';
import { ContactSection } from '@/components/version2/contact-section';
import { Footer } from '@/components/version2/footer';
import { Navigation } from '@/components/version2/navigation';
import { StructuredData } from '@/components/seo/structured-data';

export const Route = createFileRoute('/')({
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <Helmet>
        <title>Loctelli - AI-Powered Lead Generation & Qualification</title>
        <meta
          name="description"
          content="Automate your sales with AI-powered funnels. Loctelli creates ads, funnels leads into an AI chat system that qualifies and books meetings."
        />
        <meta
          name="keywords"
          content="AI infrastructure, lead generation, sales automation, AI chat, lead qualification"
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://loctelli.com" />
        <meta
          property="og:title"
          content="Loctelli - AI-Powered Lead Generation & Qualification"
        />
        <meta
          property="og:description"
          content="Automate your sales with AI-powered funnels. Triple your revenue with professional websites, automated reviews, and AI-driven lead generation."
        />
        <meta property="og:site_name" content="Loctelli" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta
          name="twitter:title"
          content="Loctelli - AI-Powered Lead Generation"
        />
        <meta
          name="twitter:description"
          content="Triple your revenue with AI marketing automation"
        />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <StructuredData />
        <Navigation />
        <main className="flex-1">
          <HeroSection />
          <ServicesSection />
          <ProcessSection />
          <ContactSection />
        </main>
        <Footer />
      </div>
    </>
  );
}

