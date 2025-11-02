---
name: mcp-builder
description: Guide for building Model Context Protocol (MCP) servers. This skill should be used when users want to create custom MCP servers to extend Claude's capabilities with new tools, resources, or integrations for external systems, APIs, databases, or specialized workflows.
version: 1.0.0
author: Permamind
license: MIT
---

# MCP Builder

This skill provides comprehensive guidance for building Model Context Protocol (MCP) servers that extend Claude's capabilities.

## About MCP Servers

MCP (Model Context Protocol) servers are standalone services that provide Claude with:
- **Tools**: Functions Claude can call to perform actions
- **Resources**: Data sources Claude can read from
- **Prompts**: Pre-defined prompt templates

MCP servers communicate with Claude through a standardized JSON-RPC protocol over stdio, HTTP with SSE, or HTTP.

## When to Use This Skill

Use this skill when:
- Building custom MCP servers for specific integrations
- Extending Claude with new tools and capabilities
- Connecting Claude to external APIs, databases, or services
- Creating reusable components for specialized workflows
- Debugging or improving existing MCP servers

## Core MCP Concepts

### Server Types

**1. Stdio Servers**
- Most common type
- Communicate via standard input/output
- Launched as subprocess by Claude
- Example: Local file system tools, database clients

**2. SSE Servers**
- Server-Sent Events over HTTP
- Long-lived connections
- Good for real-time updates
- Example: Monitoring systems, live data feeds

**3. HTTP Servers**
- Traditional request/response
- Simpler deployment
- Good for stateless operations
- Example: REST API wrappers, external service integrations

### Key Components

**Tools**: Functions Claude can invoke
```typescript
{
  name: "tool_name",
  description: "What the tool does",
  inputSchema: {
    type: "object",
    properties: {
      param: { type: "string", description: "Parameter description" }
    },
    required: ["param"]
  }
}
```

**Resources**: Data sources Claude can access
```typescript
{
  uri: "resource://identifier",
  name: "Resource Name",
  description: "What this resource provides",
  mimeType: "text/plain"
}
```

**Prompts**: Template prompts with arguments
```typescript
{
  name: "prompt_name",
  description: "What this prompt does",
  arguments: [
    { name: "arg", description: "Argument description", required: true }
  ]
}
```

## MCP Server Development Workflow

### Step 1: Plan the Server

Before writing code, define:

1. **Purpose**: What capability will this server provide?
2. **Tools**: What functions should Claude be able to call?
3. **Resources**: What data sources will Claude access?
4. **Prompts**: What template prompts are needed?
5. **Integration**: What external systems will it connect to?

**Example Planning Questions:**
- "Will this be a stdio, SSE, or HTTP server?"
- "What authentication is required for external APIs?"
- "Should tools return structured data or text?"
- "Are there rate limits to consider?"

### Step 2: Choose a Language and SDK

**Official SDKs:**
- **TypeScript/JavaScript**: `@modelcontextprotocol/sdk` (most mature)
- **Python**: `mcp` package (official, well-documented)
- **Kotlin**: Community implementation

**Recommended Stack:**
- TypeScript for production servers (best tooling)
- Python for rapid prototyping and data science integrations

### Step 3: Initialize the Project

**TypeScript:**
```bash
npm init -y
npm install @modelcontextprotocol/sdk
npm install --save-dev typescript @types/node

# Create tsconfig.json
npx tsc --init
```

**Python:**
```bash
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install mcp
```

### Step 4: Implement the Server

#### TypeScript Stdio Server Template

```typescript
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const server = new Server(
  {
    name: "my-mcp-server",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "example_tool",
        description: "Example tool that does something useful",
        inputSchema: {
          type: "object",
          properties: {
            input: {
              type: "string",
              description: "Input parameter",
            },
          },
          required: ["input"],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "example_tool") {
    const result = await performAction(args.input);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

async function performAction(input: string): Promise<any> {
  // Your tool implementation here
  return { success: true, data: input };
}

async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP server running on stdio");
}

runServer().catch(console.error);
```

#### Python Stdio Server Template

```python
#!/usr/bin/env python3
import asyncio
import json
from mcp.server import Server
from mcp.server.stdio import stdio_server
from mcp.types import Tool, TextContent

app = Server("my-mcp-server")

@app.list_tools()
async def list_tools() -> list[Tool]:
    return [
        Tool(
            name="example_tool",
            description="Example tool that does something useful",
            inputSchema={
                "type": "object",
                "properties": {
                    "input": {
                        "type": "string",
                        "description": "Input parameter"
                    }
                },
                "required": ["input"]
            }
        )
    ]

@app.call_tool()
async def call_tool(name: str, arguments: dict) -> list[TextContent]:
    if name == "example_tool":
        result = await perform_action(arguments["input"])
        return [TextContent(type="text", text=json.dumps(result))]

    raise ValueError(f"Unknown tool: {name}")

async def perform_action(input_data: str) -> dict:
    # Your tool implementation here
    return {"success": True, "data": input_data}

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(read_stream, write_stream, app.create_initialization_options())

if __name__ == "__main__":
    asyncio.run(main())
```

### Step 5: Configure the Server

Create configuration for Claude to use the server.

**For Claude Desktop (`claude_desktop_config.json`):**
```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/build/index.js"]
    }
  }
}
```

**For Claude Code (`.clauderc`):**
```json
{
  "mcpServers": {
    "my-server": {
      "command": "node",
      "args": ["/path/to/build/index.js"]
    }
  }
}
```

**For Python servers:**
```json
{
  "mcpServers": {
    "my-server": {
      "command": "python",
      "args": ["/path/to/server.py"]
    }
  }
}
```

### Step 6: Test the Server

**Manual Testing:**
```bash
# Run the server directly
node build/index.js
# Or: python server.py

# Send test JSON-RPC messages via stdin
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node build/index.js
```

**Integration Testing:**
1. Configure server in Claude Desktop or Claude Code
2. Restart Claude to load the server
3. Ask Claude to use the tools
4. Monitor stderr output for debugging

**Debugging Tips:**
- Use `console.error()` (TypeScript) or `print(..., file=sys.stderr)` (Python) for logging
- Check Claude's MCP server logs
- Validate JSON-RPC message format
- Test error handling with invalid inputs

### Step 7: Package and Distribute

**For npm packages:**
```bash
npm publish
```

**For Python packages:**
```bash
python setup.py sdist bdist_wheel
twine upload dist/*
```

**For standalone distribution:**
- Bundle all dependencies
- Provide installation instructions
- Include example configuration
- Document required environment variables

## Best Practices

### Tool Design

1. **Clear descriptions**: Tools should have descriptive names and detailed descriptions
2. **Strict schemas**: Use JSON Schema to validate inputs
3. **Error handling**: Return meaningful error messages
4. **Idempotency**: Tools should be safe to retry
5. **Type safety**: Use TypeScript or type hints for reliability

### Performance

1. **Async operations**: Use async/await for I/O operations
2. **Caching**: Cache expensive operations when appropriate
3. **Timeouts**: Set reasonable timeouts for external calls
4. **Rate limiting**: Respect API rate limits
5. **Batch operations**: Group multiple operations when possible

### Security

1. **Input validation**: Always validate and sanitize inputs
2. **Authentication**: Store credentials securely (environment variables, keychain)
3. **Permissions**: Request minimal necessary permissions
4. **Secrets**: Never log or return sensitive data
5. **Sandboxing**: Isolate dangerous operations

### Documentation

1. **Tool descriptions**: Explain what each tool does and when to use it
2. **Parameter docs**: Describe all parameters clearly
3. **Examples**: Provide usage examples
4. **Error codes**: Document possible errors
5. **Configuration**: Explain all config options

## Common Patterns

### API Wrapper Server

Wrap external APIs to make them accessible to Claude:

```typescript
// Weather API example
{
  name: "get_weather",
  description: "Get current weather for a location",
  inputSchema: {
    type: "object",
    properties: {
      location: { type: "string", description: "City name or coordinates" }
    },
    required: ["location"]
  }
}
```

### Database Client Server

Provide controlled database access:

```typescript
// SQL query example
{
  name: "query_database",
  description: "Execute a read-only SQL query",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "SELECT query to execute" }
    },
    required: ["query"]
  }
}
```

### File System Server

Safe file operations:

```typescript
// File read example
{
  name: "read_file",
  description: "Read contents of a file",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path to read" }
    },
    required: ["path"]
  }
}
```

### Search/RAG Server

Vector search and retrieval:

```typescript
// Semantic search example
{
  name: "search_docs",
  description: "Search documentation using semantic similarity",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      limit: { type: "number", description: "Max results", default: 10 }
    },
    required: ["query"]
  }
}
```

## Resources

### Official Documentation

- MCP Specification: https://spec.modelcontextprotocol.io/
- TypeScript SDK: https://github.com/modelcontextprotocol/typescript-sdk
- Python SDK: https://github.com/modelcontextprotocol/python-sdk

### Example Servers

- Filesystem: https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem
- GitHub: https://github.com/modelcontextprotocol/servers/tree/main/src/github
- PostgreSQL: https://github.com/modelcontextprotocol/servers/tree/main/src/postgres

### Community Resources

- MCP Discord: Join for support and discussions
- Example implementations: Browse community servers for patterns
- Claude Cookbooks: MCP integration examples

## Troubleshooting

### Server Not Connecting

**Symptoms**: Claude can't find or connect to server

**Solutions**:
- Verify server path in configuration
- Check file permissions (must be executable)
- Test server runs independently
- Review Claude's MCP logs

### Tools Not Appearing

**Symptoms**: Server connects but tools don't show up

**Solutions**:
- Ensure `ListToolsRequestSchema` handler is implemented
- Check tool schema validation
- Verify capabilities are declared
- Restart Claude after changes

### Tool Calls Failing

**Symptoms**: Tools are listed but fail when called

**Solutions**:
- Add error logging to tool handlers
- Validate input arguments
- Check async/await usage
- Handle exceptions properly

### Performance Issues

**Symptoms**: Tools are slow or timeout

**Solutions**:
- Add caching for expensive operations
- Use connection pooling for databases
- Implement request debouncing
- Profile and optimize hot paths

## Next Steps

After building your MCP server:

1. **Test thoroughly**: Test with various inputs and edge cases
2. **Document**: Write clear README and usage examples
3. **Share**: Publish to npm/PyPI or share source code
4. **Iterate**: Gather feedback and improve based on usage
5. **Monitor**: Track errors and performance in production
