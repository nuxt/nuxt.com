import { tool } from 'ai'
import { z } from 'zod'

export const reportIssueTool = tool({
  description: 'Use this when you cannot resolve the user\'s problem after exhausting all available tools, or when the user explicitly signals frustration or a bad experience. This surfaces an inline feedback card so the user can report the issue with full conversation context attached automatically.',
  inputSchema: z.object({
    title: z.string().max(80).describe('Short issue title describing the problem (max 80 chars)'),
    summary: z.string().describe('1-3 sentence summary of what was attempted and why it could not be resolved')
  }),
  execute: async ({ title, summary }) => ({ title, summary })
})
