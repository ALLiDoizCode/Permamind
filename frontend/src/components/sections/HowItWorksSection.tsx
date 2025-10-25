import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';

/**
 * How It Works Section Component
 *
 * Features:
 * - Section header with comment syntax (// how_it_works)
 * - 3 numbered step cards (discover, install, activate)
 * - Numbered icons with color-coded badges (blue, green, purple)
 * - Responsive grid: 1 column mobile, 3 columns desktop
 * - Card hover effects with scale and shadow
 */

interface HowItWorksStep {
  number: number;
  title: string;
  description: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

const HOW_IT_WORKS_STEPS: HowItWorksStep[] = [
  {
    number: 1,
    title: '$ discover',
    description:
      'Search the registry for agent skills that match your needs. Filter by category, author, or keywords.',
    colorClass: 'text-syntax-blue',
    bgClass: 'bg-syntax-blue/10',
    borderClass: 'border-syntax-blue/30',
  },
  {
    number: 2,
    title: '$ install',
    description:
      'Install skills via the CLI with a single command. Dependencies are handled automatically.',
    colorClass: 'text-syntax-green',
    bgClass: 'bg-syntax-green/10',
    borderClass: 'border-syntax-green/30',
  },
  {
    number: 3,
    title: '$ activate',
    description:
      'Skills activate automatically in Claude when needed, extending capabilities seamlessly.',
    colorClass: 'text-syntax-purple',
    bgClass: 'bg-syntax-purple/10',
    borderClass: 'border-syntax-purple/30',
  },
];

export function HowItWorksSection() {
  return (
    <section className="container mx-auto px-4 py-16">
      {/* Section header */}
      <h2 className="text-3xl font-bold font-mono mb-8">
        <span className="text-syntax-purple">//</span>{' '}
        <span className="text-terminal-text">how_it_works</span>
      </h2>

      {/* Step cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {HOW_IT_WORKS_STEPS.map((step) => (
          <Card
            key={step.number}
            className="hover:scale-105 hover:shadow-lg hover:shadow-syntax-blue/10 transition-all duration-300"
          >
            <CardHeader>
              {/* Numbered icon */}
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 border ${step.bgClass} ${step.borderClass}`}
              >
                <span
                  className={`text-2xl font-mono font-bold ${step.colorClass}`}
                >
                  {step.number}
                </span>
              </div>

              {/* Title and description */}
              <CardTitle className={step.colorClass}>{step.title}</CardTitle>
              <CardDescription>{step.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </section>
  );
}
