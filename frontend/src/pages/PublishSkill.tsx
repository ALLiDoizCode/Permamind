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
              Your skill will be permanently stored on Arweave and registered in the AO network.
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
                  <span>Arweave wallet (JWK format) with sufficient AR balance (~0.001 AR per skill)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-syntax-green">✓</span>
                  <span>.skillsrc configuration file in your project root</span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-mono text-syntax-cyan mb-4">
              Step 1: Create an Arweave Wallet
            </h2>
            <p className="text-terminal-muted leading-relaxed mb-4">
              You need an Arweave wallet in JWK (JSON) format to publish skills. Here are some easy ways to create one:
            </p>

            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-mono text-sm font-semibold text-syntax-yellow mb-2">Option 1: Wander Wallet (Recommended)</h3>
                <p className="text-terminal-muted text-sm mb-2">
                  Wander is a browser extension wallet for Arweave with easy JWK export:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-terminal-muted text-sm ml-4">
                  <li>Install <a href="https://wander.app" target="_blank" rel="noopener noreferrer" className="text-syntax-blue hover:underline">Wander browser extension</a></li>
                  <li>Create or import your wallet</li>
                  <li>Go to Settings → Export Private Key</li>
                  <li>Save the JWK file as <code className="text-syntax-orange">wallet.json</code></li>
                </ol>
                <p className="text-xs text-terminal-muted mt-2">
                  Documentation: <a href="https://docs.wander.app" target="_blank" rel="noopener noreferrer" className="text-syntax-blue hover:underline">docs.wander.app</a>
                </p>
              </div>

              <div>
                <h3 className="font-mono text-sm font-semibold text-syntax-yellow mb-2">Option 2: ArConnect</h3>
                <p className="text-terminal-muted text-sm mb-2">
                  ArConnect is another popular Arweave wallet extension:
                </p>
                <ol className="list-decimal list-inside space-y-1 text-terminal-muted text-sm ml-4">
                  <li>Install <a href="https://www.arconnect.io" target="_blank" rel="noopener noreferrer" className="text-syntax-blue hover:underline">ArConnect extension</a></li>
                  <li>Create your wallet</li>
                  <li>Export your private key (JWK format)</li>
                  <li>Save as <code className="text-syntax-orange">wallet.json</code></li>
                </ol>
              </div>

              <div>
                <h3 className="font-mono text-sm font-semibold text-syntax-yellow mb-2">Option 3: Generate via CLI</h3>
                <p className="text-terminal-muted text-sm mb-2">
                  Generate a wallet using Arweave CLI tools:
                </p>
                <div className="bg-terminal-bg border border-terminal-border rounded p-3 mt-2">
                  <code className="font-mono text-xs text-terminal-text block">
                    <span className="text-syntax-green">$</span> npx arweave key-create wallet.json
                  </code>
                </div>
              </div>

              <div className="bg-syntax-yellow/10 border border-syntax-yellow/30 rounded-lg p-4 mt-4">
                <p className="text-xs text-syntax-yellow font-semibold mb-1">⚠️ Security Warning</p>
                <p className="text-xs text-terminal-muted">
                  Never share your wallet.json file or commit it to version control.
                  Add it to your .gitignore file.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-mono text-syntax-cyan mb-4">
              Step 2: Fund Your Wallet
            </h2>
            <p className="text-terminal-muted leading-relaxed mb-4">
              You need AR tokens to pay for permanent storage on Arweave. Each skill costs approximately 0.001 AR to publish.
            </p>

            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
              <h3 className="font-mono text-sm font-semibold text-syntax-yellow mb-3">Where to Buy AR</h3>
              <ul className="space-y-2 text-terminal-muted text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-syntax-blue">→</span>
                  <span>Centralized exchanges (Binance, KuCoin, Gate.io, etc.)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-syntax-blue">→</span>
                  <span>DEX platforms on Arweave ecosystem</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-syntax-blue">→</span>
                  <span>Peer-to-peer exchanges</span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-mono text-syntax-cyan mb-4">
              Step 3: Configure .skillsrc
            </h2>
            <p className="text-terminal-muted leading-relaxed mb-4">
              Create a <code className="text-syntax-orange">.skillsrc</code> file in your project root with your wallet configuration.
            </p>

            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
              <h3 className="font-mono text-sm font-semibold text-terminal-text mb-3">.skillsrc</h3>
              <div className="bg-terminal-bg border border-terminal-border rounded p-4">
                <pre className="font-mono text-xs text-terminal-text">
{`{
  "wallet": "wallet.json",
  "registry": "aMF8MaSntSA_O1JMSsi3wLOcvZd1bCYLqcEQBGsxHVk",
  "gateway": "https://arweave.net"
}`}
                </pre>
              </div>

              <div className="mt-4 space-y-2 text-xs text-terminal-muted">
                <p><span className="text-syntax-cyan">wallet</span> - Path to your Arweave JWK wallet file</p>
                <p><span className="text-syntax-cyan">registry</span> - AO registry process ID (use the default above)</p>
                <p><span className="text-syntax-cyan">gateway</span> - Arweave gateway URL for uploads</p>
              </div>

              <div className="bg-syntax-yellow/10 border border-syntax-yellow/30 rounded-lg p-4 mt-4">
                <p className="text-xs text-syntax-yellow font-semibold mb-1">⚠️ Important</p>
                <p className="text-xs text-terminal-muted">
                  Add .skillsrc to your .gitignore if it contains sensitive paths.
                  The wallet path should be relative to your project root.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-mono text-syntax-cyan mb-4">
              Step 4: Publish Command
            </h2>
            <p className="text-terminal-muted leading-relaxed mb-4">
              Point the publish command to the <strong>directory</strong> containing your SKILL.md file:
            </p>

            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-mono text-sm font-semibold text-terminal-text mb-2">Basic Usage</h3>
                  <div className="bg-terminal-bg border border-terminal-border rounded p-3">
                    <code className="font-mono text-xs text-terminal-text block">
                      <span className="text-syntax-green">$</span>{' '}
                      <span className="text-terminal-text">skills publish</span>{' '}
                      <span className="text-syntax-blue">./my-skill</span>
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="font-mono text-sm font-semibold text-terminal-text mb-2">Example: Publishing a Skill from skills/ Folder</h3>
                  <div className="bg-terminal-bg border border-terminal-border rounded p-3">
                    <code className="font-mono text-xs text-terminal-text block">
                      <span className="text-syntax-green">$</span>{' '}
                      <span className="text-terminal-text">skills publish</span>{' '}
                      <span className="text-syntax-blue">./skills/arweave</span>
                    </code>
                  </div>
                </div>

                <div>
                  <h3 className="font-mono text-sm font-semibold text-terminal-text mb-2">Expected Output</h3>
                  <div className="bg-terminal-bg border border-terminal-border rounded p-3">
                    <pre className="font-mono text-xs text-syntax-green">
{`✔ Bundle uploaded: abc123...xyz789
✔ Skill registered: def456...uvw012

🎉 Skill published successfully!

  Name:        my-skill
  Version:     1.0.0
  Arweave TX:  abc123...xyz789
  Bundle Size: 4.2 KB
  Upload Cost: 0.000659 AR`}
                    </pre>
                  </div>
                </div>
              </div>

              <div className="bg-syntax-blue/10 border border-syntax-blue/30 rounded-lg p-4 mt-4">
                <p className="text-xs text-syntax-blue font-semibold mb-1">💡 Tip</p>
                <p className="text-xs text-terminal-muted">
                  The publish command must point to the <strong>directory containing SKILL.md</strong>,
                  not the SKILL.md file itself.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-mono text-syntax-cyan mb-4">
              Skill Structure
            </h2>
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
              <pre className="font-mono text-xs text-terminal-text">
{`my-skill/                 # ← Point publish command here
├── SKILL.md              # Required: Main skill file with YAML frontmatter
├── examples/             # Optional: Usage examples
└── resources/            # Optional: Additional files`}
              </pre>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-mono text-syntax-cyan mb-4">
              Complete Example
            </h2>

            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-mono text-sm font-semibold text-terminal-text mb-2">1. Project Setup</h3>
                  <div className="bg-terminal-bg border border-terminal-border rounded p-3">
                    <pre className="font-mono text-xs text-terminal-text">
{`# Create your skill directory
mkdir my-skill
cd my-skill

# Create SKILL.md with YAML frontmatter
cat > SKILL.md << 'EOF'
---
name: my-skill
version: 1.0.0
description: My awesome agent skill
tags: ["productivity", "automation"]
dependencies: []
---

# My Skill

Instructions for using this skill...
EOF`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-mono text-sm font-semibold text-terminal-text mb-2">2. Create .skillsrc (in project root)</h3>
                  <div className="bg-terminal-bg border border-terminal-border rounded p-3">
                    <pre className="font-mono text-xs text-terminal-text">
{`{
  "wallet": "wallet.json",
  "registry": "aMF8MaSntSA_O1JMSsi3wLOcvZd1bCYLqcEQBGsxHVk",
  "gateway": "https://arweave.net"
}`}
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="font-mono text-sm font-semibold text-terminal-text mb-2">3. Publish</h3>
                  <div className="bg-terminal-bg border border-terminal-border rounded p-3">
                    <code className="font-mono text-xs text-terminal-text block">
                      <span className="text-syntax-green">$</span>{' '}
                      <span className="text-terminal-text">skills publish</span>{' '}
                      <span className="text-syntax-blue">./my-skill</span>
                    </code>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-mono text-syntax-cyan mb-4">
              Wallet Tools & Resources
            </h2>
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <span className="text-syntax-blue font-mono">→</span>
                  <div>
                    <a href="https://wander.app" target="_blank" rel="noopener noreferrer" className="text-syntax-blue hover:underline font-semibold">
                      Wander Wallet
                    </a>
                    <p className="text-xs text-terminal-muted mt-1">Browser extension with easy JWK export</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-syntax-blue font-mono">→</span>
                  <div>
                    <a href="https://www.arconnect.io" target="_blank" rel="noopener noreferrer" className="text-syntax-blue hover:underline font-semibold">
                      ArConnect
                    </a>
                    <p className="text-xs text-terminal-muted mt-1">Popular Arweave wallet extension</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-syntax-blue font-mono">→</span>
                  <div>
                    <a href="https://faucet.arweave.net" target="_blank" rel="noopener noreferrer" className="text-syntax-blue hover:underline font-semibold">
                      Arweave Testnet Faucet
                    </a>
                    <p className="text-xs text-terminal-muted mt-1">Get free testnet AR tokens for testing</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold font-mono text-syntax-cyan mb-4">
              Troubleshooting
            </h2>
            <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6 space-y-4">
              <div>
                <h3 className="font-mono text-sm font-semibold text-syntax-red mb-2">Error: SKILL.md not found</h3>
                <p className="text-terminal-muted text-sm">
                  Make sure you're pointing to the directory containing SKILL.md, not the file itself.
                </p>
                <div className="bg-terminal-bg border border-terminal-border rounded p-3 mt-2">
                  <code className="font-mono text-xs">
                    <span className="text-syntax-red">✗</span> skills publish ./my-skill/SKILL.md<br/>
                    <span className="text-syntax-green">✓</span> skills publish ./my-skill
                  </code>
                </div>
              </div>

              <div>
                <h3 className="font-mono text-sm font-semibold text-syntax-red mb-2">Error: Insufficient funds</h3>
                <p className="text-terminal-muted text-sm">
                  Your wallet needs at least ~0.001 AR to publish a skill. Check your balance and add more AR if needed.
                </p>
              </div>

              <div>
                <h3 className="font-mono text-sm font-semibold text-syntax-red mb-2">Error: wallet.json not found</h3>
                <p className="text-terminal-muted text-sm">
                  Make sure your .skillsrc file points to the correct wallet path and the file exists.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
