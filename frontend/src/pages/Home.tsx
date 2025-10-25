import { HeroSection } from '@/components/sections/HeroSection';
import { StatsSection } from '@/components/sections/StatsSection';
import { FeaturedSkillsSection } from '@/components/sections/FeaturedSkillsSection';
import { HowItWorksSection } from '@/components/sections/HowItWorksSection';

export function Home() {
  return (
    <div>
      {/* Hero Section with 2-line heading, terminal window, and CTAs */}
      <HeroSection />

      {/* Aggregate Stats Section */}
      <StatsSection />

      {/* Main Content Container */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Featured Skills Section */}
          <FeaturedSkillsSection />
        </div>
      </div>

      {/* How It Works Section */}
      <HowItWorksSection />
    </div>
  );
}
