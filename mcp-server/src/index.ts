#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { loadConfig, MissingEnvironmentVariableError } from './config.js';
import { createLogger, setLogger, logger } from './logger.js';
import {
  handlePublishSkill,
  translateError as translatePublishError,
  formatSuccessResponse as formatPublishResponse,
} from './tools/publish-skill.js';
import {
  handleSearchSkills,
  translateError as translateSearchError,
  formatSuccessResponse as formatSearchResponse,
} from './tools/search-skills.js';
import {
  handleInstallSkill,
  translateError as translateInstallError,
  formatSuccessResponse as formatInstallResponse,
} from './tools/install-skill.js';

/**
 * Server metadata (exported for use by tools)
 */
export const serverInfo = {
  name: '@permamind/skills-mcp-server',
  version: '0.1.0',
  protocolVersion: '2024-11-05',
};

/**
 * MCP Server instance (exported for testing)
 */
export const server = new Server(
  {
    name: serverInfo.name,
    version: serverInfo.version,
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * Wallet address (set lazily on first publish, exported for tools)
 * Empty string until first publish operation generates wallet
 */
export let walletAddress: string = '';

/**
 * Main server initialization function
 */
async function main(): Promise<void> {
  try {
    // Load configuration from environment variables
    const config = loadConfig();

    // Initialize logger with configured log level
    const loggerInstance = createLogger(config.logLevel);
    setLogger(loggerInstance);

    logger.info('Starting MCP server...', {
      name: serverInfo.name,
      version: serverInfo.version,
      protocolVersion: serverInfo.protocolVersion,
    });

    // Wallet generation moved to publish_skill tool (lazy generation when needed)
    // This significantly improves server startup time (no 10-30s wait for RSA key generation)
    logger.info('MCP server initialization complete (wallet will be generated on first publish)');

    // Register tools - List Tools Handler
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
          {
            name: 'publish_skill',
            description:
              'Publish a skill to the Agent Skills Registry on Arweave and AO. Requires SEED_PHRASE environment variable for wallet generation.',
            inputSchema: {
              type: 'object',
              properties: {
                directory: {
                  type: 'string',
                  description: 'Absolute path to skill directory containing SKILL.md',
                },
                verbose: {
                  type: 'boolean',
                  description: 'Enable verbose debug logging (optional, default: false)',
                },
              },
              required: ['directory'],
            },
          },
          {
            name: 'search_skills',
            description:
              'Search the Agent Skills Registry for skills by keyword or tag. Returns skills matching the query in name, description, or tags.',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description:
                    'Search query string (matches name/description/tags). Empty string lists all skills.',
                },
                tags: {
                  type: 'array',
                  items: { type: 'string' },
                  description:
                    'Filter by specific tags (AND logic - skills must have ALL specified tags). Optional.',
                },
                verbose: {
                  type: 'boolean',
                  description: 'Enable verbose debug logging (optional, default: false)',
                },
              },
              required: ['query'],
            },
          },
          {
            name: 'install_skill',
            description:
              'Install a skill from the Agent Skills Registry with automatic dependency resolution. Supports name@version format (e.g., ao-basics@1.0.0) or just name for latest version.',
            inputSchema: {
              type: 'object',
              properties: {
                skillName: {
                  type: 'string',
                  description:
                    'Name of skill to install (supports name@version format, e.g., ao-basics@1.0.0)',
                },
                force: {
                  type: 'boolean',
                  description:
                    'Overwrite existing installations without confirmation (optional, default: false)',
                },
                installLocation: {
                  type: 'string',
                  description:
                    'Custom installation directory path (optional, defaults to ~/.claude/skills)',
                },
                verbose: {
                  type: 'boolean',
                  description: 'Enable verbose debug logging (optional, default: false)',
                },
              },
              required: ['skillName'],
            },
          },
        ],
      };
    });

    // Register tools - Call Tool Handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;

      if (toolName === 'ping') {
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

      if (toolName === 'publish_skill') {
        try {
          const { directory, verbose = false } = request.params.arguments as {
            directory: string;
            verbose?: boolean;
          };

          logger.info('Handling publish_skill tool call', { directory, verbose });

          const result = await handlePublishSkill(directory, verbose);
          const response = formatPublishResponse(result);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response, null, 2),
              },
            ],
          };
        } catch (error) {
          const errorResponse = translatePublishError(error as Error);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(errorResponse, null, 2),
              },
            ],
            isError: true,
          };
        }
      }

      if (toolName === 'search_skills') {
        try {
          const { query, tags = [], verbose = false } = request.params.arguments as {
            query: string;
            tags?: string[];
            verbose?: boolean;
          };

          logger.info('Handling search_skills tool call', { query, tags, verbose });

          const searchResult = await handleSearchSkills(query, tags, verbose);
          const response = formatSearchResponse(searchResult.results, searchResult.query, searchResult.tags);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response, null, 2),
              },
            ],
          };
        } catch (error) {
          const errorResponse = translateSearchError(error as Error);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(errorResponse, null, 2),
              },
            ],
            isError: true,
          };
        }
      }

      if (toolName === 'install_skill') {
        try {
          const { skillName, force = false, installLocation, verbose = false } = request.params.arguments as {
            skillName: string;
            force?: boolean;
            installLocation?: string;
            verbose?: boolean;
          };

          logger.info('Handling install_skill tool call', { skillName, force, installLocation, verbose });

          const installResult = await handleInstallSkill(skillName, force, installLocation, verbose);
          const response = formatInstallResponse(installResult.result, installResult.installLocation);

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(response, null, 2),
              },
            ],
          };
        } catch (error) {
          const errorResponse = translateInstallError(error as Error);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(errorResponse, null, 2),
              },
            ],
            isError: true,
          };
        }
      }

      // Tool not found
      throw new Error(`Unknown tool: ${toolName}`);
    });

    logger.info('Registered tools: ping, publish_skill, search_skills, install_skill');

    // Setup error handler
    server.onerror = (error) => {
      logger.error('MCP server error:', { error: error.message, stack: error.stack });
    };

    // Connect to stdio transport
    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info('MCP server connected to stdio transport');
  } catch (error) {
    if (error instanceof MissingEnvironmentVariableError) {
      // eslint-disable-next-line no-console
      console.error(`Configuration Error: ${error.message}`);
      // eslint-disable-next-line no-console
      console.error(`Solution: ${error.solution}`);
      process.exit(1);
    }

    // eslint-disable-next-line no-console
    console.error('Fatal initialization error:', error);
    process.exit(1);
  }
}

// Start server
main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled error in main():', error);
  process.exit(1);
});
