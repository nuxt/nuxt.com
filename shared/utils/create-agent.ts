import { type Tool, Experimental_Agent as SDKAgent, type StopCondition, type LanguageModel } from 'ai'
import { experimental_createMCPClient, stepCountIs } from 'ai'
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js'
import { defu } from 'defu'
import { TOOL_USAGE_GUIDELINES, GENERAL_GUIDELINES, FORMATTING_RULES } from './shared-prompts'

export type Agent = SDKAgent<Record<string, Tool>, unknown, unknown> & {
  close(): Promise<void>
}

interface CreateAgentOptions {
  /**
   * Specific expertise description for this agent
   */
  expertise?: string

  /**
   * Additional system prompt content (will be appended after expertise)
   */
  additionalSystemPrompt?: string

  /**
   * Custom guidelines (will replace default if provided)
   */
  guidelines?: string

  /**
   * Override the default model
   */
  model?: LanguageModel

  /**
   * Override max output tokens
   */
  maxOutputTokens?: number

  /**
   * Override stop condition
   */
  stopWhen?: StopCondition<any>

  /**
   * MCP server URL - if provided, MCP tools will be loaded automatically
   */
  mcpUrl?: string | URL

  /**
   * Additional tools for the agent
   * If mcpUrl is provided, these tools will be merged with MCP tools
   */
  tools?: Record<string, Tool> | (() => Promise<Record<string, Tool>>)
}

const DEFAULT_CONFIG = {
  model: 'moonshotai/kimi-k2-turbo',
  maxOutputTokens: 10000,
  stopWhen: stepCountIs(5)
}

function buildSystemPrompt(options: CreateAgentOptions, hasTools: boolean): string {
  const systemPromptParts: string[] = []

  if (options.expertise) {
    systemPromptParts.push(`You are an expert AI assistant specialized in this domain.

Your expertise includes:
${options.expertise}`)
  }

  if (hasTools) {
    systemPromptParts.push('')
    systemPromptParts.push(TOOL_USAGE_GUIDELINES)
  }

  systemPromptParts.push('')
  systemPromptParts.push(options.guidelines || GENERAL_GUIDELINES)

  systemPromptParts.push('')
  systemPromptParts.push(FORMATTING_RULES)

  if (options.additionalSystemPrompt) {
    systemPromptParts.push('')
    systemPromptParts.push(options.additionalSystemPrompt)
  }

  return systemPromptParts.join('\n')
}

export async function createAgent(options: CreateAgentOptions & Record<string, any> = {}): Promise<Agent> {
  const config = defu(options, DEFAULT_CONFIG)
  const hasTools = !!(config.mcpUrl || config.tools)
  const system = buildSystemPrompt(options, hasTools)

  const agentConfig: any = {
    model: config.model,
    maxOutputTokens: config.maxOutputTokens,
    system,
    stopWhen: config.stopWhen,
    ...options
  }

  let mcpClient: any = null

  if (config.mcpUrl || config.tools) {
    let allTools: Record<string, Tool> = {}

    if (config.mcpUrl) {
      const httpTransport = new StreamableHTTPClientTransport(
        new URL(config.mcpUrl)
      )
      mcpClient = await experimental_createMCPClient({
        transport: httpTransport as any
      })
      allTools = await mcpClient.tools()
    }

    if (config.tools) {
      const additionalTools = typeof config.tools === 'function'
        ? await config.tools()
        : config.tools
      allTools = { ...allTools, ...additionalTools }
    }

    agentConfig.tools = allTools
  }

  const agent = new SDKAgent(agentConfig)

  return Object.assign(agent, {
    close: async () => {
      if (mcpClient) {
        await mcpClient.close()
      }
    }
  }) as Agent
}
