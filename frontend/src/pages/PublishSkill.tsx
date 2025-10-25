export function PublishSkill() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold font-mono mb-6">
          <span className="text-syntax-purple">//</span>{' '}
          <span className="text-terminal-text">Publish a Skill</span>
        </h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold font-mono text-syntax-cyan mb-4">
              Publishing to the Registry
            </h2>
            <p className="text-terminal-muted leading-relaxed mb-4">
              Share your agent skills with the community by publishing them to the Arweave-based registry.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-mono text-syntax-cyan mb-4">
              Prerequisites
            </h2>
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
              <ul className="space-y-2 text-terminal-muted text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-syntax-green">✓</span>
                  <span>Skills CLI installed globally</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-syntax-green">✓</span>
                  <span>SKILL.md file with proper YAML frontmatter</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-syntax-green">✓</span>
                  <span>Arweave wallet with sufficient balance</span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-mono text-syntax-cyan mb-4">
              Publish Command
            </h2>
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
              <code className="font-mono text-sm">
                <span className="text-syntax-green">$</span>{' '}
                <span className="text-terminal-text">skills publish</span>
              </code>
            </div>
            <p className="text-xs text-terminal-muted mt-2">
              This command will package your skill and publish it to the Arweave network.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-mono text-syntax-cyan mb-4">
              Skill Structure
            </h2>
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
              <pre className="font-mono text-xs text-terminal-text">
{`my-skill/
├── SKILL.md          # Required: Main skill file
├── examples/         # Optional: Usage examples
└── resources/        # Optional: Additional files`}
              </pre>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
