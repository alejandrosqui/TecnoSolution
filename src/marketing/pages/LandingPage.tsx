import HeroSection from "@/marketing/components/HeroSection";
import FeaturesSection from "@/marketing/components/FeaturesSection";
import WorkflowSection from "@/marketing/components/WorkflowSection";
import PricingSection from "@/marketing/components/PricingSection";
import FooterSection from "@/marketing/components/FooterSection";

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <WorkflowSection />
      <PricingSection />
      <FooterSection />
    </div>
  );
};

export default LandingPage;
