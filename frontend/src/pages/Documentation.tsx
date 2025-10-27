export function Documentation() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold font-mono mb-6">
          <span className="text-syntax-purple">//</span>{' '}
          <span className="text-terminal-text">Documentation</span>
        </h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold font-mono text-syntax-green mb-4">
              Getting Started
            </h2>
            <p className="text-terminal-muted leading-relaxed mb-4">
              Learn how to use Permamind to discover, install, and manage agent skills for Claude on the permanent web.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-mono text-syntax-green mb-4">
              Quick Start
            </h2>
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
              <div className="space-y-3 font-mono text-sm">
                <div>
                  <span className="text-syntax-green">$</span>{' '}
                  <span className="text-terminal-text">npm install -g @permamind/skills</span>
                </div>
                <div>
                  <span className="text-syntax-green">$</span>{' '}
                  <span className="text-terminal-text">skills search ao</span>
                </div>
                <div>
                  <span className="text-syntax-green">$</span>{' '}
                  <span className="text-terminal-text">skills install ao</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-mono text-syntax-green mb-4">
              What are Agent Skills?
            </h2>
            <p className="text-terminal-muted leading-relaxed">
              Agent Skills are modular capabilities that extend Claude's functionality.
              They package specialized instructions, metadata, and resources to enable
              Claude to operate as a domain expert rather than a generalist.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
