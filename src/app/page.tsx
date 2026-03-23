import {
  Navbar,
  HeroSection,
  FeaturesSection,
  HowItWorks,
  ComparisonSection,
  StatsSection,
  TrustLogos,
  TestimonialsSection,
  PricingSection,
  FAQSection,
  CTASection,
  StickyCTA,
  Footer,
} from '@/components/landing';
export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <ComparisonSection />
      <StatsSection />
      <TrustLogos />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
      <StickyCTA />
      <Footer />
    </main>
  );
}
