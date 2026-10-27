import { defineAgent } from 'eve'

export default defineAgent({
  description: 'Triages issues with a decision model and escalates unsure ones to a reviewer subagent.',
  model: 'anthropic/claude-sonnet-5',
  // Triage runs only through the triage_issues workflow, with no shell, files, or web access.
  tool: false,
  defaultTools: false,
})
