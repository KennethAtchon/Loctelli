import { HeroSection } from "@/components/version1/hero-section";
import { HowItWorks } from "@/components/version1/how-it-works";
import { FeaturesSection } from "@/components/version1/features-section";
import { ContactSection } from "@/components/version1/contact-section";
import { Footer } from "@/components/version1/footer";
import { Navigation } from "@/components/version1/navigation";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <main className="flex-1">
        <HeroSection />
        <HowItWorks />
        <FeaturesSection />
        {/* <DemoSection />
        <Testimonials />
        <PricingSection /> */}
        <ContactSection />
      </main>
      <Footer />
    </div>
  );
}