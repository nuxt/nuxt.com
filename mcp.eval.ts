import { experimental_createMCPClient as createMCPClient } from '@ai-sdk/mcp'
import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { evalite } from 'evalite'
import { wrapAISDKModel } from 'evalite/ai-sdk'
import { toolCallAccuracy } from 'evalite/scorers'

/**
 * MCP Evaluation Tests
 *
 * Note: The MCP server has prompts (find_documentation_for_topic, deployment_guide, migration_help)
 * that would improve these scenarios, but @ai-sdk/mcp doesn't support converting prompts to tools yet.
 *
 * TODO: Once @ai-sdk/mcp supports prompt-to-tool conversion or prompt usage in generateText,
 * uncomment the tests below that require search/topic-based navigation.
 *
 * Related: https://ai-sdk.dev/docs/reference/ai-sdk-core/create-mcp-client
 */

const MCP_URL = process.env.MCP_URL ?? 'http://localhost:3000/mcp'
const model = wrapAISDKModel(openai('gpt-5.1-codex-mini'))

evalite('Evaluate Nuxt MCP Documentation Tools', {
  data: async () => [
    // TODO: Uncomment when find_documentation_for_topic prompt becomes usable as a tool
    // {
    //   input: 'I keep getting hydration mismatch errors in my Nuxt app. Find the documentation that explains this.',
    //   expected: [{ toolName: 'find_documentation_for_topic', input: { topic: 'hydration errors' } }],
    // },
    // {
    //   input: 'What are the different rendering modes available in Nuxt 4 and which one should I use for SEO?',
    //   expected: [{ toolName: 'find_documentation_for_topic', input: { topic: 'rendering modes SSR SEO' } }],
    // },
    // {
    //   input: 'How do I migrate my composables from Nuxt 3 to Nuxt 4?',
    //   expected: [{ toolName: 'migration_help', input: { fromVersion: '3.x', toVersion: '4.x' } }],
    // },
    {
      input: 'Show me the introduction page for Nuxt 4',
      expected: [{ toolName: 'get_documentation_page', input: { path: '/docs/4.x/getting-started/introduction' } }]
    }
  ],
  task: async (input) => {
    const mcpClient = await createMCPClient({ transport: { type: 'http', url: MCP_URL } })
    try {
      const result = await generateText({ model, prompt: input, tools: await mcpClient.tools() })
      return result.toolCalls ?? []
    } finally {
      await mcpClient.close()
    }
  },
  scorers: [async ({ output, expected }) => toolCallAccuracy({ actualCalls: output, expectedCalls: expected })]
})

evalite('Evaluate Nuxt MCP Blog Tools', {
  data: async () => [
    { input: 'What are the latest performance improvements announced for Nuxt?', expected: [{ toolName: 'list_blog_posts' }] },
    { input: 'Show me announcements about major version releases', expected: [{ toolName: 'list_blog_posts' }] },
    { input: 'Has there been any blog post about server components or islands architecture?', expected: [{ toolName: 'list_blog_posts' }] },
    { input: 'Get the blog post about Nuxt 4', expected: [{ toolName: 'get_blog_post', input: { path: '/blog/v4' } }] }
  ],
  task: async (input) => {
    const mcpClient = await createMCPClient({ transport: { type: 'http', url: MCP_URL } })
    try {
      const result = await generateText({ model, prompt: input, tools: await mcpClient.tools() })
      return result.toolCalls ?? []
    } finally {
      await mcpClient.close()
    }
  },
  scorers: [async ({ output, expected }) => toolCallAccuracy({ actualCalls: output, expectedCalls: expected })]
})

evalite('Evaluate Nuxt MCP Deploy Tools', {
  data: async () => [
    { input: 'I need a deployment platform that supports edge functions and has a generous free tier. What are my options?', expected: [{ toolName: 'list_deploy_providers' }] },
    { input: 'What deployment providers support Docker containerization?', expected: [{ toolName: 'list_deploy_providers' }] },
    { input: 'I want to self-host my Nuxt app with automatic SSL. Show me how to deploy to a VPS.', expected: [{ toolName: 'list_deploy_providers' }] }
    // TODO: Uncomment when deployment_guide prompt becomes usable as a tool
    // { input: 'How do I deploy to Vercel?', expected: [{ toolName: 'deployment_guide', input: { provider: 'Vercel' } }] },
  ],
  task: async (input) => {
    const mcpClient = await createMCPClient({ transport: { type: 'http', url: MCP_URL } })
    try {
      const result = await generateText({ model, prompt: input, tools: await mcpClient.tools() })
      return result.toolCalls ?? []
    } finally {
      await mcpClient.close()
    }
  },
  scorers: [async ({ output, expected }) => toolCallAccuracy({ actualCalls: output, expectedCalls: expected })]
})

evalite('Evaluate Nuxt MCP Module Tools', {
  data: async () => [
    { input: 'I need to add authentication with social login providers to my app. Find me a suitable module.', expected: [{ toolName: 'list_modules', input: { category: 'authentication' } }] },
    { input: 'What modules are available for image optimization and lazy loading?', expected: [{ toolName: 'list_modules', input: { category: 'media' } }] },
    { input: 'Show me popular UI component libraries for Nuxt 4', expected: [{ toolName: 'list_modules', input: { category: 'ui' } }] },
    { input: 'I want to add i18n support for multiple languages. What module should I use and does it support Nuxt 4?', expected: [{ toolName: 'list_modules' }, { toolName: 'get_module', input: { slug: '@nuxtjs/i18n' } }] },
    { input: 'Get details about @nuxt/ui module', expected: [{ toolName: 'get_module', input: { slug: '@nuxt/ui' } }] }
  ],
  task: async (input) => {
    const mcpClient = await createMCPClient({ transport: { type: 'http', url: MCP_URL } })
    try {
      const result = await generateText({ model, prompt: input, tools: await mcpClient.tools(), maxSteps: 3 })
      return result.toolCalls ?? []
    } finally {
      await mcpClient.close()
    }
  },
  scorers: [async ({ output, expected }) => toolCallAccuracy({ actualCalls: output, expectedCalls: expected })]
})

evalite('Evaluate Nuxt MCP Cross-Tool Workflows', {
  data: async () => [
    { input: 'I want to build an e-commerce site with Nuxt 4. What modules do I need and where should I deploy it?', expected: [{ toolName: 'list_modules' }, { toolName: 'list_deploy_providers' }] },
    { input: 'Show me the latest features in Nuxt 4 and link to the relevant documentation', expected: [{ toolName: 'list_blog_posts' }, { toolName: 'get_documentation_page', input: { path: '/docs/4.x/getting-started/introduction' } }] }
  ],
  task: async (input) => {
    const mcpClient = await createMCPClient({ transport: { type: 'http', url: MCP_URL } })
    try {
      const result = await generateText({ model, prompt: input, tools: await mcpClient.tools(), maxSteps: 5 })
      return result.toolCalls ?? []
    } finally {
      await mcpClient.close()
    }
  },
  scorers: [async ({ output, expected }) => toolCallAccuracy({ actualCalls: output, expectedCalls: expected })]
})
