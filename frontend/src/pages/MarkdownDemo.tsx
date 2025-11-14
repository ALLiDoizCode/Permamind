/**
 * Markdown Renderer Demo Page
 *
 * Side-by-side comparison of old custom parser vs new react-markdown
 */
import { MarkdownRenderer } from '@/components/MarkdownRenderer';

const sampleMarkdown = `
# Markdown Demo

## Code Blocks with Syntax Highlighting

Here's some JavaScript code:

\`\`\`javascript
const hello = "world";
console.log(hello);

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}
\`\`\`

And some TypeScript:

\`\`\`typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const users: User[] = [
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" }
];
\`\`\`

Lua code:

\`\`\`lua
function processMessage(msg)
  local action = msg.Action
  if action == "Info" then
    ao.send({ Target = msg.From, Data = "Hello from AO" })
  end
end
\`\`\`

## Other Features

**Bold text**, *italic text*, and \`inline code\`.

> This is a blockquote with **formatting**.

### Lists

- Item one with \`code\`
- Item two with **bold**
- Item three with [link](https://example.com)

### Table

| Feature | Old | New |
|---------|-----|-----|
| Syntax Highlighting | ❌ | ✅ |
| Copy Button | ✅ | ✅ |
| GFM Support | ❌ | ✅ |
`;

export function MarkdownDemo() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-terminal-text mb-8">
        Markdown Renderer Demo
      </h1>

      <div className="max-w-4xl mx-auto">
        {/* Renderer Demo */}
        <div>
          <h2 className="text-xl font-bold text-syntax-cyan mb-4 font-mono">
            react-markdown Renderer
          </h2>
          <div className="border border-terminal-border rounded-lg p-6 bg-terminal-surface">
            <MarkdownRenderer content={sampleMarkdown} />
          </div>
        </div>
      </div>

      <div className="mt-8 p-6 bg-terminal-surface border border-terminal-border rounded-lg max-w-4xl mx-auto">
        <h3 className="text-lg font-bold text-terminal-text mb-4">
          Features with react-markdown:
        </h3>
        <ul className="space-y-2 text-terminal-text">
          <li className="flex items-start gap-2">
            <span className="text-syntax-green">✓</span>
            <span><strong>Syntax highlighting</strong> - Code looks professional with highlight.js</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-syntax-green">✓</span>
            <span><strong>GFM support</strong> - Tables, strikethrough, task lists, autolinks</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-syntax-green">✓</span>
            <span><strong>Better parsing</strong> - Handles edge cases correctly</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-syntax-green">✓</span>
            <span><strong>Active maintenance</strong> - 14M+ downloads/week, security updates</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-syntax-green">✓</span>
            <span><strong>Plugin ecosystem</strong> - Easy to add emoji, math, diagrams, etc.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
