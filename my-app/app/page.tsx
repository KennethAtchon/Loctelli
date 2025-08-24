import { HeroSection } from "@/components/version2/hero-section";
import { ServicesSection } from "@/components/version2/services-section";
import { ProcessSection } from "@/components/version2/process-section";
import { ContactSection } from "@/components/version2/contact-section";
import { Footer } from "@/components/version2/footer";
import { Navigation } from "@/components/version2/navigation";
import { StructuredData } from "@/components/seo/structured-data";

export default function Home() {
  return (
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
  );
}