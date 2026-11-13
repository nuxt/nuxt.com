import { createMCPClient } from '@ai-sdk/mcp'
import { generateText, isStepCount } from 'ai'
import { evalite } from 'evalite'
import { toolCallAccuracy } from 'evalite/scorers'
import { NUXI_GATEWAY_TAG } from '../layers/nuxi/shared/utils/ai-gateway'

/**
 * MCP Evaluation Tests
 *
 * Topic questions go through `search-documentation`; the migration case still needs the
 * migration_help prompt, which @ai-sdk/mcp can't call as a tool yet.
 *
 * Related: https://ai-sdk.dev/docs/reference/ai-sdk-core/create-mcp-client
 */
const model = 'openai/gpt-5.1-codex-mini'
const MCP_URL = process.env.MCP_URL ?? 'http://localhost:3000/mcp'

/**
 * Evals share the agent's AI Gateway key, so untagged runs land in team-wide
 * reports and inflate Nuxi's apparent spend. No `zeroDataRetention` here: the
 * eval model has no guaranteed ZDR provider and the harness would fail outright.
 */
const providerOptions = {
  gateway: {
    tags: [NUXI_GATEWAY_TAG, 'surface:eval']
  }
}

evalite('Evaluate Nuxt MCP Documentation Tools', {
  data: async () => [
    {
      input: 'I keep getting hydration mismatch errors in my Nuxt app. Find the documentation that explains this.',
      expected: [{ toolName: 'search-documentation' }]
    },
    {
      input: 'What are the different rendering modes available in Nuxt 4 and which one should I use for SEO?',
      expected: [{ toolName: 'search-documentation' }]
    },
    // TODO: Uncomment when the migration_help prompt becomes usable as a tool
    // {
    //   input: 'How do I migrate my composables from Nuxt 3 to Nuxt 4?',
    //   expected: [{ toolName: 'migration_help', input: { fromVersion: '3.x', toVersion: '4.x' } }],
    // },
    {
      input: 'Show me the introduction page for Nuxt 4',
      expected: [{ toolName: 'get-documentation-page', input: { path: '/docs/4.x/getting-started/introduction' } }]
    }
  ],
  task: async (input) => {
    const mcpClient = await createMCPClient({ transport: { type: 'http', url: MCP_URL } })
    try {
      const result = await generateText({
        model,
        prompt: input,
        providerOptions,
        tools: await mcpClient.tools()
      })
      return result.toolCalls ?? []
    } finally {
      await mcpClient.close()
    }
  },
  scorers: [async ({ output, expected }) => toolCallAccuracy({ actualCalls: output, expectedCalls: expected })]
})

evalite('Evaluate Nuxt MCP Blog Tools', {
  data: async () => [
    { input: 'What are the latest performance improvements announced for Nuxt?', expected: [{ toolName: 'list-blog-posts' }] },
    { input: 'Show me announcements about major version releases', expected: [{ toolName: 'list-blog-posts' }] },
    { input: 'Has there been any blog post about server components or islands architecture?', expected: [{ toolName: 'list-blog-posts' }] },
    { input: 'Get the blog post about Nuxt 4', expected: [{ toolName: 'get-blog-post', input: { path: '/blog/v4' } }] }
  ],
  task: async (input) => {
    const mcpClient = await createMCPClient({ transport: { type: 'http', url: MCP_URL } })
    try {
      const result = await generateText({
        model,
        prompt: input,
        providerOptions,
        tools: await mcpClient.tools()
      })
      return result.toolCalls ?? []
    } finally {
      await mcpClient.close()
    }
  },
  scorers: [async ({ output, expected }) => toolCallAccuracy({ actualCalls: output, expectedCalls: expected })]
})

evalite('Evaluate Nuxt MCP Deploy Tools', {
  data: async () => [
    { input: 'I need a deployment platform that supports edge functions and has a generous free tier. What are my options?', expected: [{ toolName: 'list-deploy-providers' }] },
    { input: 'What deployment providers support Docker containerization?', expected: [{ toolName: 'list-deploy-providers' }] },
    { input: 'I want to self-host my Nuxt app with automatic SSL. Show me how to deploy to a VPS.', expected: [{ toolName: 'list-deploy-providers' }] }
    // TODO: Uncomment when deployment_guide prompt becomes usable as a tool
    // { input: 'How do I deploy to Vercel?', expected: [{ toolName: 'deployment_guide', input: { provider: 'Vercel' } }] },
  ],
  task: async (input) => {
    const mcpClient = await createMCPClient({ transport: { type: 'http', url: MCP_URL } })
    try {
      const result = await generateText({
        model,
        prompt: input,
        providerOptions,
        tools: await mcpClient.tools()
      })
      return result.toolCalls ?? []
    } finally {
      await mcpClient.close()
    }
  },
  scorers: [async ({ output, expected }) => toolCallAccuracy({ actualCalls: output, expectedCalls: expected })]
})

evalite('Evaluate Nuxt MCP Module Tools', {
  data: async () => [
    { input: 'I need to add authentication with social login providers to my app. Find me a suitable module.', expected: [{ toolName: 'list-modules', input: { category: 'authentication' } }] },
    { input: 'What modules are available for image optimization and lazy loading?', expected: [{ toolName: 'list-modules', input: { category: 'media' } }] },
    { input: 'Show me popular UI component libraries for Nuxt 4', expected: [{ toolName: 'list-modules', input: { category: 'ui' } }] },
    { input: 'I want to add i18n support for multiple languages. What module should I use and does it support Nuxt 4?', expected: [{ toolName: 'list-modules' }, { toolName: 'get-module', input: { slug: '@nuxtjs/i18n' } }] },
    { input: 'Get details about @nuxt/ui module', expected: [{ toolName: 'get-module', input: { slug: '@nuxt/ui' } }] }
  ],
  task: async (input) => {
    const mcpClient = await createMCPClient({ transport: { type: 'http', url: MCP_URL } })
    try {
      const result = await generateText({ model, prompt: input, providerOptions, tools: await mcpClient.tools(), stopWhen: isStepCount(3) })
      return result.toolCalls ?? []
    } finally {
      await mcpClient.close()
    }
  },
  scorers: [async ({ output, expected }) => toolCallAccuracy({ actualCalls: output, expectedCalls: expected })]
})

evalite('Evaluate Nuxt MCP Cross-Tool Workflows', {
  data: async () => [
    { input: 'I want to build an e-commerce site with Nuxt 4. What modules do I need and where should I deploy it?', expected: [{ toolName: 'list-modules' }, { toolName: 'list-deploy-providers' }] },
    { input: 'Show me the latest features in Nuxt 4 and link to the relevant documentation', expected: [{ toolName: 'list-blog-posts' }, { toolName: 'get-documentation-page', input: { path: '/docs/4.x/getting-started/introduction' } }] }
  ],
  task: async (input) => {
    const mcpClient = await createMCPClient({ transport: { type: 'http', url: MCP_URL } })
    try {
      const result = await generateText({ model, prompt: input, providerOptions, tools: await mcpClient.tools(), stopWhen: isStepCount(5) })
      return result.toolCalls ?? []
    } finally {
      await mcpClient.close()
    }
  },
  scorers: [async ({ output, expected }) => toolCallAccuracy({ actualCalls: output, expectedCalls: expected })]
})
