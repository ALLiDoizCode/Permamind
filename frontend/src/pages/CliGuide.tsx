export function CliGuide() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold font-mono mb-6">
          <span className="text-syntax-green">$</span>{' '}
          <span className="text-terminal-text">CLI Guide</span>
        </h1>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-semibold font-mono text-syntax-cyan mb-4">
              Installation
            </h2>
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
              <code className="font-mono text-sm">
                <span className="text-syntax-green">$</span>{' '}
                <span className="text-terminal-text">
                  npm install -g @permamind/skills
                </span>
              </code>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-mono text-syntax-cyan mb-4">
              Commands
            </h2>
            <div className="space-y-4">
              <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
                <h3 className="text-lg font-mono text-syntax-green mb-2">
                  search
                </h3>
                <p className="text-terminal-muted text-sm mb-3">
                  Search for skills in the registry
                </p>
                <code className="font-mono text-sm">
                  <span className="text-syntax-green">$</span>{' '}
                  <span className="text-terminal-text">
                    skills search [query]
                  </span>
                </code>
              </div>

              <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
                <h3 className="text-lg font-mono text-syntax-green mb-2">
                  install
                </h3>
                <p className="text-terminal-muted text-sm mb-3">
                  Install a skill from the registry
                </p>
                <code className="font-mono text-sm">
                  <span className="text-syntax-green">$</span>{' '}
                  <span className="text-terminal-text">
                    skills install [skill-name]
                  </span>
                </code>
              </div>

              <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
                <h3 className="text-lg font-mono text-syntax-green mb-2">
                  list
                </h3>
                <p className="text-terminal-muted text-sm mb-3">
                  List installed skills
                </p>
                <code className="font-mono text-sm">
                  <span className="text-syntax-green">$</span>{' '}
                  <span className="text-terminal-text">skills list</span>
                </code>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
