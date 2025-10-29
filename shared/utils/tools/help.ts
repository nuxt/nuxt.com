import type { UIToolInvocation } from 'ai'
import { tool } from 'ai'
import { z } from 'zod'

export type HelpToolInvocation = UIToolInvocation<typeof helpTool>

export const helpTool = tool({
  description: 'Display a help interface when you cannot answer a question. Use this whenever you don\'t know the answer, regardless of whether it\'s within or outside the Nuxt ecosystem. The UI will include an input field for users to ask questions to the team and links to Discord, Twitter, and GitHub issues.',
  inputSchema: z.object({
    reason: z.string().describe('Brief explanation of why you cannot answer this question')
  }),
  execute: async ({ reason }) => {
    return { reason }
  }
})
