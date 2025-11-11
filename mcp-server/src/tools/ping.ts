import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { server, serverInfo, walletAddress } from '../index.js';

/**
 * Register ping tool handlers with MCP server
 * This tool provides a health check to verify MCP connectivity
 */
export function registerPingTool(): void {
  // Register tool metadata (for tools/list request)
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'ping',
          description: 'Health check tool to verify MCP server connectivity',
          inputSchema: {
            type: 'object',
            properties: {},
            required: [],
          },
        },
      ],
    };
  });

  // Register tool handler (for tools/call request)
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    if (request.params.name === 'ping') {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                status: 'ok',
                message: 'MCP server is running',
                serverInfo: serverInfo,
                walletAddress: walletAddress,
                timestamp: Date.now(),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    // Tool not found
    throw new Error(`Unknown tool: ${request.params.name}`);
  });
}
