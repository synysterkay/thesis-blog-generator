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
    </main>
  );
}
