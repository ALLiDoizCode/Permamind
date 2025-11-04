import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export function McpGuide() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold font-mono mb-4">
            <span className="text-syntax-purple">//</span>{' '}
            <span className="text-terminal-text">MCP Server</span>
          </h1>
          <p className="text-terminal-muted text-lg">
            Integrate Permamind directly into Claude via Model Context Protocol
          </p>
          <div className="flex gap-2 mt-4">
            <Badge variant="default" className="font-mono">
              @permamind/mcp v1.0.14
            </Badge>
            <Badge variant="green" className="font-mono">
              Claude Desktop
            </Badge>
            <Badge variant="cyan" className="font-mono">
              Claude Code
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="desktop">Claude Desktop</TabsTrigger>
            <TabsTrigger value="code">Claude Code</TabsTrigger>
            <TabsTrigger value="tools">Available Tools</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold font-mono text-syntax-green mb-4">
                What is the MCP Server?
              </h2>
              <p className="text-terminal-muted leading-relaxed mb-4">
                The Permamind MCP Server exposes the Agent Skills Registry
                directly to Claude AI through the{' '}
                <a
                  href="https://modelcontextprotocol.io"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-syntax-blue hover:underline"
                >
                  Model Context Protocol
                </a>
                . This allows Claude to search, install, and publish skills
                without requiring manual CLI commands.
              </p>

              <Card className="bg-terminal-surface border-terminal-border p-6">
                <h3 className="text-lg font-mono text-syntax-cyan mb-3">
                  Key Features
                </h3>
                <ul className="space-y-2 text-terminal-muted">
                  <li className="flex items-start gap-2">
                    <span className="text-syntax-green">▸</span>
                    <span>
                      <strong className="text-terminal-text">
                        Direct Integration:
                      </strong>{' '}
                      Claude can search and install skills conversationally
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-syntax-green">▸</span>
                    <span>
                      <strong className="text-terminal-text">
                        Automatic Setup:
                      </strong>{' '}
                      Wallet generation and configuration handled automatically
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-syntax-green">▸</span>
                    <span>
                      <strong className="text-terminal-text">
                        Publishing Support:
                      </strong>{' '}
                      Publish new skills directly from Claude conversations
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-syntax-green">▸</span>
                    <span>
                      <strong className="text-terminal-text">
                        Health Check:
                      </strong>{' '}
                      Built-in ping tool to verify server connectivity
                    </span>
                  </li>
                </ul>
              </Card>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-mono text-syntax-green mb-4">
                Quick Start
              </h2>
              <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
                <div className="space-y-3 font-mono text-sm">
                  <div>
                    <span className="text-syntax-purple"># Install the MCP server</span>
                  </div>
                  <div>
                    <span className="text-syntax-green">$</span>{' '}
                    <span className="text-terminal-text">
                      npm install -g @permamind/mcp
                    </span>
                  </div>
                  <div className="mt-4">
                    <span className="text-syntax-purple"># Or run directly with npx</span>
                  </div>
                  <div>
                    <span className="text-syntax-green">$</span>{' '}
                    <span className="text-terminal-text">
                      npx @permamind/mcp
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold font-mono text-syntax-green mb-4">
                Wallet Configuration
              </h2>
              <p className="text-terminal-muted mb-4">
                The MCP server supports three wallet methods with automatic fallback:
              </p>

              <Card className="bg-terminal-surface border-terminal-border p-6 mb-4">
                <h3 className="text-lg font-mono text-syntax-cyan mb-3">
                  Option 1: Seed Phrase (Recommended)
                </h3>
                <p className="text-terminal-muted text-sm mb-3">
                  Set the SEED_PHRASE environment variable for automatic wallet generation:
                </p>
                <div className="bg-terminal-bg border border-terminal-border rounded p-4">
                  <div className="space-y-2 font-mono text-sm">
                    <div>
                      <span className="text-syntax-purple">
                        # Set your seed phrase (12-word mnemonic)
                      </span>
                    </div>
                    <div>
                      <span className="text-syntax-green">$</span>{' '}
                      <span className="text-terminal-text">
                        export SEED_PHRASE="your twelve word mnemonic phrase here..."
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-terminal-surface border-terminal-border p-6 mb-4">
                <h3 className="text-lg font-mono text-syntax-cyan mb-3">
                  Option 2: Browser Wallet (Interactive)
                </h3>
                <p className="text-terminal-muted text-sm mb-3">
                  If no SEED_PHRASE is provided, the MCP server will open your browser
                  with a custom Permamind-branded UI to connect your Arweave wallet
                  (ArConnect or Wander extension):
                </p>
                <ul className="space-y-2 text-terminal-muted text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-syntax-green">▸</span>
                    <span>
                      <strong className="text-terminal-text">
                        Interactive approval:
                      </strong>{' '}
                      Approve each transaction in your browser
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-syntax-green">▸</span>
                    <span>
                      <strong className="text-terminal-text">
                        Custom UI:
                      </strong>{' '}
                      Permamind-branded terminal dark theme interface
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-syntax-green">▸</span>
                    <span>
                      <strong className="text-terminal-text">
                        Requires:
                      </strong>{' '}
                      ArConnect or Wander browser extension installed
                    </span>
                  </li>
                </ul>
                <div className="mt-4 bg-terminal-bg border border-terminal-border rounded p-4">
                  <p className="font-mono text-xs text-terminal-text">
                    No SEED_PHRASE needed - wallet connection handled through browser
                  </p>
                </div>
              </Card>

              <Card className="bg-terminal-surface border-terminal-border p-6">
                <h3 className="text-lg font-mono text-syntax-cyan mb-3">
                  Option 3: Wallet File (Advanced)
                </h3>
                <p className="text-terminal-muted text-sm mb-3">
                  Provide a path to your Arweave wallet JSON file:
                </p>
                <div className="bg-terminal-bg border border-terminal-border rounded p-4">
                  <div className="space-y-2 font-mono text-sm">
                    <div>
                      <span className="text-syntax-purple">
                        # Specify wallet file path
                      </span>
                    </div>
                    <div>
                      <span className="text-terminal-text">
                        --wallet /path/to/wallet.json
                      </span>
                    </div>
                  </div>
                </div>
              </Card>

              <div className="mt-4 p-4 bg-syntax-blue/10 border border-syntax-blue/30 rounded-lg">
                <p className="text-syntax-blue text-sm font-mono">
                  <strong>💡 Automatic Fallback:</strong> The MCP server tries
                  SEED_PHRASE → Browser Wallet → Wallet File in order
                </p>
              </div>
            </section>
          </TabsContent>

          {/* Claude Desktop Tab */}
          <TabsContent value="desktop" className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold font-mono text-syntax-green mb-4">
                Claude Desktop Integration
              </h2>
              <p className="text-terminal-muted leading-relaxed mb-4">
                Configure the MCP server in Claude Desktop to enable native
                integration with the Agent Skills Registry.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-mono text-syntax-cyan mb-3">
                Step 1: Install the Server
              </h3>
              <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
                <div className="space-y-3 font-mono text-sm">
                  <div>
                    <span className="text-syntax-green">$</span>{' '}
                    <span className="text-terminal-text">
                      npm install -g @permamind/mcp
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-mono text-syntax-cyan mb-3">
                Step 2: Configure Claude Desktop
              </h3>
              <p className="text-terminal-muted mb-4">
                Add the MCP server to your Claude Desktop configuration file:
              </p>

              <Card className="bg-terminal-surface border-terminal-border p-4 mb-4">
                <p className="text-terminal-muted text-sm mb-2">
                  <strong className="text-terminal-text">macOS:</strong>{' '}
                  <code className="text-syntax-cyan">
                    ~/Library/Application Support/Claude/claude_desktop_config.json
                  </code>
                </p>
                <p className="text-terminal-muted text-sm">
                  <strong className="text-terminal-text">Windows:</strong>{' '}
                  <code className="text-syntax-cyan">
                    %APPDATA%\Claude\claude_desktop_config.json
                  </code>
                </p>
              </Card>

              <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
                <pre className="font-mono text-sm overflow-x-auto">
                  <code className="text-terminal-text">
                    {`{
  "mcpServers": {
    "permamind": {
      "command": "npx",
      "args": ["-y", "@permamind/mcp"],
      "env": {
        "SEED_PHRASE": "your twelve word seed phrase here"
      }
    }
  }
}`}
                  </code>
                </pre>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-mono text-syntax-cyan mb-3">
                Step 3: Restart Claude Desktop
              </h3>
              <p className="text-terminal-muted mb-4">
                Completely quit and restart Claude Desktop for the changes to
                take effect.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-mono text-syntax-cyan mb-3">
                Step 4: Verify Installation
              </h3>
              <p className="text-terminal-muted mb-4">
                In Claude Desktop, you should see the MCP server indicator. Try
                asking:
              </p>
              <Card className="bg-terminal-surface border-terminal-border p-6">
                <p className="font-mono text-sm text-terminal-text">
                  "Can you search for AO skills using the Permamind MCP server?"
                </p>
              </Card>
            </section>
          </TabsContent>

          {/* Claude Code Tab */}
          <TabsContent value="code" className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold font-mono text-syntax-green mb-4">
                Claude Code Integration
              </h2>
              <p className="text-terminal-muted leading-relaxed mb-4">
                Configure the MCP server in Claude Code (VS Code extension) for
                seamless integration.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-mono text-syntax-cyan mb-3">
                Step 1: Install the Server
              </h3>
              <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
                <div className="space-y-3 font-mono text-sm">
                  <div>
                    <span className="text-syntax-green">$</span>{' '}
                    <span className="text-terminal-text">
                      npm install -g @permamind/mcp
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-mono text-syntax-cyan mb-3">
                Step 2: Configure MCP Settings
              </h3>
              <p className="text-terminal-muted mb-4">
                Add the MCP server to your Claude Code MCP settings:
              </p>

              <Card className="bg-terminal-surface border-terminal-border p-4 mb-4">
                <p className="text-terminal-muted text-sm">
                  <strong className="text-terminal-text">Settings Path:</strong>{' '}
                  <code className="text-syntax-cyan">
                    ~/.claude/mcp_settings.json
                  </code>
                </p>
              </Card>

              <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
                <pre className="font-mono text-sm overflow-x-auto">
                  <code className="text-terminal-text">
                    {`{
  "mcpServers": {
    "permamind": {
      "command": "npx",
      "args": ["-y", "@permamind/mcp"],
      "env": {
        "SEED_PHRASE": "your twelve word seed phrase here"
      }
    }
  }
}`}
                  </code>
                </pre>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-mono text-syntax-cyan mb-3">
                Step 3: Reload VS Code
              </h3>
              <p className="text-terminal-muted mb-4">
                Reload VS Code window or restart the Claude Code extension.
              </p>
              <div className="bg-terminal-surface border border-terminal-border rounded-lg p-6">
                <div className="space-y-3 font-mono text-sm">
                  <div>
                    <span className="text-syntax-purple">
                      # Command Palette (Cmd/Ctrl + Shift + P)
                    </span>
                  </div>
                  <div>
                    <span className="text-terminal-text">
                      Developer: Reload Window
                    </span>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h3 className="text-xl font-mono text-syntax-cyan mb-3">
                Step 4: Verify Integration
              </h3>
              <p className="text-terminal-muted mb-4">
                In Claude Code chat, try using Permamind tools:
              </p>
              <Card className="bg-terminal-surface border-terminal-border p-6">
                <p className="font-mono text-sm text-terminal-text">
                  "Search for blockchain skills in Permamind"
                </p>
              </Card>
            </section>
          </TabsContent>

          {/* Available Tools Tab */}
          <TabsContent value="tools" className="space-y-6">
            <section>
              <h2 className="text-2xl font-semibold font-mono text-syntax-green mb-4">
                Available MCP Tools
              </h2>
              <p className="text-terminal-muted mb-6">
                The Permamind MCP server exposes the following tools to Claude:
              </p>
            </section>

            <div className="space-y-4">
              {/* Ping Tool */}
              <Card className="bg-terminal-surface border-terminal-border p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-mono text-syntax-cyan">ping</h3>
                  <Badge variant="blue" className="font-mono text-xs">
                    Health Check
                  </Badge>
                </div>
                <p className="text-terminal-muted text-sm mb-4">
                  Verify MCP server connectivity and status.
                </p>
                <div className="bg-terminal-bg border border-terminal-border rounded p-4">
                  <code className="font-mono text-xs text-terminal-text">
                    No parameters required
                  </code>
                </div>
                <div className="mt-4">
                  <p className="text-terminal-muted text-sm mb-2">
                    <strong className="text-terminal-text">Returns:</strong>
                  </p>
                  <div className="bg-terminal-bg border border-terminal-border rounded p-4">
                    <code className="font-mono text-xs text-terminal-text">
                      {`{ "status": "ok", "message": "Permamind MCP server is running" }`}
                    </code>
                  </div>
                </div>
              </Card>

              {/* Search Skills Tool */}
              <Card className="bg-terminal-surface border-terminal-border p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-mono text-syntax-cyan">
                    search_skills
                  </h3>
                  <Badge variant="green" className="font-mono text-xs">
                    Discovery
                  </Badge>
                </div>
                <p className="text-terminal-muted text-sm mb-4">
                  Search for skills in the Agent Skills Registry by keyword or
                  tag.
                </p>
                <div className="bg-terminal-bg border border-terminal-border rounded p-4">
                  <pre className="font-mono text-xs text-terminal-text">
                    {`{
  "query": string,        // Search query (required)
  "tags": string[],       // Filter by tags (optional)
  "verbose": boolean      // Debug logging (optional)
}`}
                  </pre>
                </div>
                <div className="mt-4">
                  <p className="text-terminal-muted text-sm mb-2">
                    <strong className="text-terminal-text">Example:</strong>
                  </p>
                  <Card className="bg-terminal-bg border-terminal-border p-4">
                    <p className="font-mono text-xs text-syntax-purple mb-2">
                      # Ask Claude:
                    </p>
                    <p className="font-mono text-xs text-terminal-text">
                      "Search for AO protocol skills"
                    </p>
                  </Card>
                </div>
              </Card>

              {/* Install Skill Tool */}
              <Card className="bg-terminal-surface border-terminal-border p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-mono text-syntax-cyan">
                    install_skill
                  </h3>
                  <Badge variant="cyan" className="font-mono text-xs">
                    Installation
                  </Badge>
                </div>
                <p className="text-terminal-muted text-sm mb-4">
                  Install a skill from the registry with automatic dependency
                  resolution.
                </p>
                <div className="bg-terminal-bg border border-terminal-border rounded p-4">
                  <pre className="font-mono text-xs text-terminal-text">
                    {`{
  "skillName": string,         // Skill name (required)
  "installLocation": string,   // Install directory (optional)
  "force": boolean,            // Overwrite existing (optional)
  "verbose": boolean           // Debug logging (optional)
}`}
                  </pre>
                </div>
                <div className="mt-4">
                  <p className="text-terminal-muted text-sm mb-2">
                    <strong className="text-terminal-text">Example:</strong>
                  </p>
                  <Card className="bg-terminal-bg border-terminal-border p-4">
                    <p className="font-mono text-xs text-syntax-purple mb-2">
                      # Ask Claude:
                    </p>
                    <p className="font-mono text-xs text-terminal-text">
                      "Install the ao-basics skill"
                    </p>
                  </Card>
                </div>
              </Card>

              {/* Publish Skill Tool */}
              <Card className="bg-terminal-surface border-terminal-border p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-mono text-syntax-cyan">
                    publish_skill
                  </h3>
                  <Badge variant="purple" className="font-mono text-xs">
                    Publishing
                  </Badge>
                </div>
                <p className="text-terminal-muted text-sm mb-4">
                  Publish a new skill to the Agent Skills Registry on Arweave
                  and AO.
                </p>
                <div className="bg-terminal-bg border border-terminal-border rounded p-4">
                  <pre className="font-mono text-xs text-terminal-text">
                    {`{
  "directory": string,    // Skill directory path (required)
  "verbose": boolean      // Debug logging (optional)
}`}
                  </pre>
                </div>
                <div className="mt-4">
                  <p className="text-terminal-muted text-sm mb-2">
                    <strong className="text-terminal-text">Example:</strong>
                  </p>
                  <Card className="bg-terminal-bg border-terminal-border p-4">
                    <p className="font-mono text-xs text-syntax-purple mb-2">
                      # Ask Claude:
                    </p>
                    <p className="font-mono text-xs text-terminal-text">
                      "Publish the skill in ./my-skill directory"
                    </p>
                  </Card>
                </div>
              </Card>
            </div>

            <section className="mt-8">
              <h3 className="text-xl font-mono text-syntax-cyan mb-4">
                Usage Tips
              </h3>
              <Card className="bg-terminal-surface border-terminal-border p-6">
                <ul className="space-y-3 text-terminal-muted text-sm">
                  <li className="flex items-start gap-2">
                    <span className="text-syntax-green">▸</span>
                    <span>
                      <strong className="text-terminal-text">
                        Natural Language:
                      </strong>{' '}
                      Claude will automatically use the appropriate tool based
                      on your conversational request
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-syntax-green">▸</span>
                    <span>
                      <strong className="text-terminal-text">
                        Automatic Wallet:
                      </strong>{' '}
                      First-time use will generate an Arweave wallet from your
                      SEED_PHRASE
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-syntax-green">▸</span>
                    <span>
                      <strong className="text-terminal-text">
                        Dependency Resolution:
                      </strong>{' '}
                      install_skill automatically handles dependencies
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-syntax-green">▸</span>
                    <span>
                      <strong className="text-terminal-text">
                        Version Support:
                      </strong>{' '}
                      Use name@version format (e.g., "ao-basics@1.0.0") for
                      specific versions
                    </span>
                  </li>
                </ul>
              </Card>
            </section>
          </TabsContent>
        </Tabs>

        {/* Additional Resources */}
        <section className="mt-12 pt-8 border-t border-terminal-border">
          <h2 className="text-2xl font-semibold font-mono text-syntax-green mb-4">
            Additional Resources
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-terminal-surface border-terminal-border p-6">
              <h3 className="text-lg font-mono text-syntax-cyan mb-2">
                CLI Guide
              </h3>
              <p className="text-terminal-muted text-sm mb-4">
                Learn about the command-line interface for Permamind
              </p>
              <a
                href="/cli-guide"
                className="text-syntax-blue hover:underline font-mono text-sm"
              >
                View CLI Documentation →
              </a>
            </Card>

            <Card className="bg-terminal-surface border-terminal-border p-6">
              <h3 className="text-lg font-mono text-syntax-cyan mb-2">
                GitHub Repository
              </h3>
              <p className="text-terminal-muted text-sm mb-4">
                Source code, issues, and contributions
              </p>
              <a
                href="https://github.com/ALLiDoizCode/Permamind"
                target="_blank"
                rel="noopener noreferrer"
                className="text-syntax-blue hover:underline font-mono text-sm"
              >
                Visit GitHub →
              </a>
            </Card>

            <Card className="bg-terminal-surface border-terminal-border p-6">
              <h3 className="text-lg font-mono text-syntax-cyan mb-2">
                MCP Protocol
              </h3>
              <p className="text-terminal-muted text-sm mb-4">
                Learn more about Model Context Protocol
              </p>
              <a
                href="https://modelcontextprotocol.io"
                target="_blank"
                rel="noopener noreferrer"
                className="text-syntax-blue hover:underline font-mono text-sm"
              >
                Visit MCP Docs →
              </a>
            </Card>

            <Card className="bg-terminal-surface border-terminal-border p-6">
              <h3 className="text-lg font-mono text-syntax-cyan mb-2">
                Discord Community
              </h3>
              <p className="text-terminal-muted text-sm mb-4">
                Get help and connect with other users
              </p>
              <a
                href="https://discord.gg/yDJFBtfS4K"
                target="_blank"
                rel="noopener noreferrer"
                className="text-syntax-blue hover:underline font-mono text-sm"
              >
                Join Discord →
              </a>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
