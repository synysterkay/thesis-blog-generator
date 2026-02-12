import {
  Navbar,
  HeroSection,
  FeaturesSection,
  HowItWorks,
  ComparisonSection,
  StatsSection,
  TestimonialsSection,
  PricingSection,
  FAQSection,
  CTASection,
  Footer,
} from '@/components/landing';
import { MobileAppPopup } from '@/components/mobile-app-popup';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <ComparisonSection />
      <StatsSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <Footer />
      <MobileAppPopup />
    </main>
  );
}
