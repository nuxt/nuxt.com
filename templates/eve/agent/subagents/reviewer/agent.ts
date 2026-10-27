import { defineAgent } from 'eve'

export default defineAgent({
  description: 'Classify one issue and summarize it.',
  model: 'anthropic/claude-sonnet-5',
  // Only the triage workflow calls the reviewer, and it only reads the issue it is sent.
  tool: false,
  defaultTools: false,
})
