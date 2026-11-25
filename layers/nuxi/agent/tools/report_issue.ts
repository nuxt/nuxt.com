import { defineTool } from 'eve/tools'
import { z } from 'zod'

export default defineTool({
  description: 'Use this when you cannot resolve the user\'s problem after exhausting all available tools, or when the user explicitly signals frustration or a bad experience. This shows an inline feedback card; the report is sent, with the conversation attached, only when the user clicks its Report issue button.',
  inputSchema: z.object({
    title: z.string().max(80).describe('Short issue title describing the problem (max 80 chars)'),
    summary: z.string().describe('1-3 sentence summary of what was attempted and why it could not be resolved')
  }),
  async execute({ title, summary }) {
    return { title, summary, sent: false, note: 'The card is shown to the user. Nothing is sent until they click Report issue: invite them to, and never say the issue was filed.' }
  }
})
