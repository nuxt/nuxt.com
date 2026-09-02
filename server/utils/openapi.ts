/**
 * OpenAPI description of the public surface of nuxt.com.
 *
 * The discovery layer (the negotiated pages, their raw twins, `sitemap.md`,
 * the llms indexes, the `.well-known` documents, the MCP endpoint) is
 * contributed by `nuxt-agent-discovery` from the same route config the
 * negotiation and the CDN rewrites use, so it cannot drift from what the site
 * actually serves. What stays here is what only this site knows: the
 * `/api/v1/**` endpoints (public and stable, used by other Nuxt core repos
 * such as `nuxt/cli`, see `server/api/v1/README.md`) and the prose.
 *
 * The chat, auth, newsletter and admin endpoints are left out on purpose:
 * they back the site's own UI, and documenting them would read as an
 * invitation to build on surfaces that can change.
 *
 * Kept dependency-free on purpose: the discovery fragments are passed in
 * rather than imported, so the document builds in a plain unit test.
 */

// OpenAPI ignores a header parameter named `Accept`, so the negotiation is
// described in prose instead.
const MARKDOWN_DESCRIPTION = 'Every documentation, blog and deploy page is available as Markdown. Append `.md` to the URL, or send `Accept: text/markdown` on the HTML URL. Known AI agent user agents receive Markdown by default.'

/** The `tags`, `paths` and `components` `agentDiscoveryOpenApi()` returns. */
export interface OpenApiFragments {
  tags: Record<string, unknown>[]
  paths: Record<string, unknown>
  components: { headers?: Record<string, unknown>, responses?: Record<string, unknown>, schemas?: Record<string, unknown> }
}

/** Nitro's JSON error payload, returned by every `/api/**` failure. */
function jsonError(description: string) {
  return {
    description,
    content: {
      'application/json': {
        schema: { $ref: '#/components/schemas/Error' }
      }
    }
  }
}

function json(schemaRef: string, description: string) {
  return {
    description,
    content: {
      'application/json': {
        schema: { $ref: `#/components/schemas/${schemaRef}` }
      }
    }
  }
}

/**
 * The site's own paths, exported separately so the route can hand them to
 * `agentDiscoveryOpenApi({ paths })`: the generated operations then take a
 * suffix on any id collision instead of shadowing one of these.
 */
export const apiPaths: Record<string, unknown> = {
  '/api/v1/modules': {
    get: {
      operationId: 'listModules',
      tags: ['Modules'],
      summary: 'List Nuxt modules',
      description: 'The module directory shown on nuxt.com/modules, with aggregate stats, maintainers and contributors.',
      parameters: [
        {
          name: 'version',
          in: 'query',
          description: 'Nuxt major versions the modules may be compatible with. Separate multiple values with commas.',
          schema: { type: 'string', examples: ['4', '3,4', '5,4,3'], default: '4' }
        },
        {
          name: 'category',
          in: 'query',
          description: 'Keep modules of this category only (case-insensitive).',
          schema: { type: 'string' }
        }
      ],
      responses: {
        200: json('ModuleList', 'The modules matching the filters, with aggregate stats.')
      }
    }
  },
  '/api/v1/modules/health': {
    get: {
      operationId: 'getModulesHealth',
      tags: ['Modules'],
      summary: 'Module health scores',
      description: 'Health metadata per module, keyed by module name. Served separately from the list so it can be merged in when available.',
      responses: {
        200: {
          description: 'Health entries keyed by module name.',
          content: {
            'application/json': {
              schema: { type: 'object', additionalProperties: { $ref: '#/components/schemas/ModuleHealth' } }
            }
          }
        }
      }
    }
  },
  '/api/v1/modules/{name}': {
    get: {
      operationId: 'getModule',
      tags: ['Modules'],
      summary: 'One module with its readme',
      description: 'A single module by directory name, enriched with download/star stats, contributors and the rendered readme.',
      parameters: [
        {
          name: 'name',
          in: 'path',
          required: true,
          description: 'The module name as listed by `listModules` (e.g. `content`, `tailwindcss`).',
          schema: { type: 'string' }
        }
      ],
      responses: {
        200: json('Module', 'The module.'),
        404: jsonError('No module with that name.')
      }
    }
  },
  '/api/v1/teams': {
    get: {
      operationId: 'getTeams',
      tags: ['Team'],
      summary: 'Core and ecosystem teams',
      description: 'The Nuxt core team and the ecosystem team, core members deduplicated out of the latter.',
      responses: {
        200: json('Teams', 'Both teams.')
      }
    }
  },
  '/api/v1/teams/{slug}': {
    get: {
      operationId: 'getTeamMembers',
      tags: ['Team'],
      summary: 'Members of one team',
      parameters: [
        {
          name: 'slug',
          in: 'path',
          required: true,
          schema: { type: 'string', enum: ['core', 'ecosystem', 'ui'] }
        }
      ],
      responses: {
        200: {
          description: 'The GitHub members of the team.',
          content: {
            'application/json': {
              schema: { type: 'array', items: { $ref: '#/components/schemas/TeamMember' } }
            }
          }
        },
        404: jsonError('Unknown team slug.')
      }
    }
  }
}

export function createOpenApiDocument(options: { url: string, discovery: OpenApiFragments }) {
  const { url, discovery } = options

  return {
    openapi: '3.1.0',
    info: {
      title: 'Nuxt',
      summary: 'Documentation, content and metadata endpoints of nuxt.com.',
      description: [
        'Nuxt is an open source framework that makes web development intuitive and powerful.',
        '',
        'This specification covers the public, read-only endpoints agents can use to read the documentation, the module directory and the team metadata.',
        '',
        `- Markdown documentation: ${MARKDOWN_DESCRIPTION}`,
        `- MCP server: \`POST ${url}/mcp\` (streamable HTTP). See ${url}/.well-known/mcp/server-card.json`,
        `- LLM indexes: ${url}/llms.txt and ${url}/llms-full.txt`,
        '',
        'No authentication is required and no endpoint mutates state.'
      ].join('\n'),
      version: '1.0.0',
      license: {
        name: 'MIT',
        identifier: 'MIT'
      },
      contact: {
        name: 'Nuxt',
        url: `${url}/docs`
      }
    },
    servers: [{ url, description: 'Production' }],
    // Everything here is public and read-only: an empty requirement tells
    // agents no credentials are needed, rather than leaving them to guess.
    security: [],
    tags: [
      ...discovery.tags,
      { name: 'Modules', description: 'The module directory behind nuxt.com/modules.' },
      { name: 'Team', description: 'The Nuxt core and ecosystem teams.' }
    ],
    // Site paths last, so a site-specific description always wins a collision.
    paths: {
      ...discovery.paths,
      ...apiPaths
    },
    components: {
      ...discovery.components,
      schemas: {
        ...discovery.components.schemas,
        Error: {
          type: 'object',
          description: 'Nitro error payload.',
          properties: {
            statusCode: { type: 'integer' },
            statusMessage: { type: 'string' },
            message: { type: 'string' }
          }
        },
        Module: {
          type: 'object',
          description: 'A Nuxt module as listed on nuxt.com/modules.',
          additionalProperties: true,
          properties: {
            name: { type: 'string' },
            npm: { type: 'string', description: 'The npm package name.' },
            description: { type: 'string' },
            repo: { type: 'string', description: 'GitHub `owner/repo` slug.' },
            website: { type: 'string' },
            category: { type: 'string' },
            type: { type: 'string', enum: ['official', 'community', '3rd-party'] },
            compatibility: { type: 'object', additionalProperties: true },
            stats: { type: 'object', additionalProperties: true },
            maintainers: { type: 'array', items: { type: 'object', additionalProperties: true } },
            contributors: { type: 'array', items: { type: 'object', additionalProperties: true } },
            readme: { type: 'string', description: 'Rendered readme, only on `getModule`.' }
          }
        },
        ModuleList: {
          type: 'object',
          properties: {
            version: { type: 'string' },
            generatedAt: { type: 'string', format: 'date-time' },
            stats: {
              type: 'object',
              properties: {
                downloads: { type: 'integer' },
                stars: { type: 'integer' },
                maintainers: { type: 'integer' },
                contributors: { type: 'integer' },
                modules: { type: 'integer' }
              }
            },
            maintainers: { type: 'array', items: { type: 'object', additionalProperties: true } },
            contributors: { type: 'array', items: { type: 'object', additionalProperties: true } },
            modules: { type: 'array', items: { $ref: '#/components/schemas/Module' } }
          }
        },
        ModuleHealth: {
          type: 'object',
          description: 'Health metadata for one module, as reported by nuxt.care.',
          additionalProperties: true
        },
        TeamMember: {
          type: 'object',
          additionalProperties: true,
          properties: {
            login: { type: 'string' },
            name: { type: 'string' },
            avatarUrl: { type: 'string' },
            websiteUrl: { type: 'string' },
            sponsorsListing: { type: 'string' }
          }
        },
        Teams: {
          type: 'object',
          properties: {
            core: { type: 'array', items: { $ref: '#/components/schemas/TeamMember' } },
            ecosystem: { type: 'array', items: { $ref: '#/components/schemas/TeamMember' } }
          }
        }
      }
    }
  }
}
