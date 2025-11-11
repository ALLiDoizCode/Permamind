import { useNavigate } from 'react-router-dom';
import { SearchBar } from '@/components/SearchBar';
import { Button } from '@/components/ui/button';
import { navigateToSearch } from '@/lib/navigation';
import { SkillMetadata } from '@/types/ao';

/**
 * Hero Section Component
 *
 * Features:
 * - 2-line heading with shimmer animation
 * - Subheading with purple // comment syntax
 * - Search bar with navigation
 * - Two CTA buttons (Explore Skills, CLI Guide)
 * - Terminal window block with CLI examples
 * - Dark terminal theme background
 */
export function HeroSection() {
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(navigateToSearch(query));
    }
  };

  const handleSkillSelect = (skill: SkillMetadata) => {
    navigate(`/skills/${encodeURIComponent(skill.name)}`);
  };

  return (
    <section className="bg-terminal-bg py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* 2-line heading with shimmer */}
          <h1 className="text-5xl md:text-6xl font-bold font-mono mb-6 leading-tight">
            <span className="mono-gradient-animated">Permamind</span>
            <br />
            <span className="text-terminal-text">Agent Skills for Claude</span>
          </h1>

          {/* Subheading with purple // comment */}
          <p className="text-lg text-terminal-muted mb-8 font-mono">
            <span className="text-syntax-purple">// </span>
            Permanent, decentralized skills on Arweave & AO
            <span className="cursor-blink text-syntax-blue">_</span>
          </p>

          {/* Search bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <SearchBar
              onSearch={handleSearch}
              onSkillSelect={handleSkillSelect}
            />
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center justify-center gap-4 mb-12">
            <Button
              variant="default"
              size="lg"
              onClick={() => navigate('/search')}
            >
              <span className="mr-2">→</span> Explore Skills
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => navigate('/docs')}
            >
              <span className="mr-2 font-mono text-syntax-green">$</span> CLI
              Guide
            </Button>
          </div>

          {/* Terminal Window Block */}
          <div className="mt-12 max-w-2xl mx-auto bg-terminal-surface border border-terminal-border rounded-lg p-4 text-left">
            {/* Terminal window controls */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-terminal-border">
              <div className="w-3 h-3 rounded-full bg-syntax-red"></div>
              <div className="w-3 h-3 rounded-full bg-syntax-yellow"></div>
              <div className="w-3 h-3 rounded-full bg-syntax-green"></div>
              <span className="text-xs text-terminal-muted font-mono ml-2">
                quick-start.sh
              </span>
            </div>

            {/* CLI Examples */}
            <div className="font-mono text-sm">
              <div className="text-terminal-muted mb-1"># Install the CLI</div>
              <div>
                <span className="text-syntax-green">$</span>{' '}
                <span className="text-terminal-text">
                  npm install -g @permamind/skills
                </span>
              </div>
              <div className="mt-3 text-terminal-muted mb-1">
                # Install a skill
              </div>
              <div>
                <span className="text-syntax-green">$</span>{' '}
                <span className="text-terminal-text">skills install </span>
                <span className="text-syntax-cyan">ao</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
