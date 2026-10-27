import { defineWorkflowTool } from 'eve/tools'
import { z } from 'zod'
import { CONFIDENCE_THRESHOLD, Review, decideIssues, loadIssues, type Finding } from '../lib/triage'

export default defineWorkflowTool({
  description: 'Triage the open issues: give each one a category and a priority, and return the findings.',
  inputSchema: z.object({}),
  label: {
    start: () => 'Triaging issues',
  },
  async execute(_input, ctx) {
    'use workflow'
    const batch = await loadIssues()

    // A fast decision model answers every issue first.
    const decisions = await decideIssues(batch, ctx.abortSignal)

    // Only the issues it is unsure about go to a reviewer subagent, each in a fresh session.
    const findings = await Promise.all(batch.map(async (issue, index): Promise<Finding> => {
      const decision = decisions[index]!
      if (decision.confidence >= CONFIDENCE_THRESHOLD) {
        return { number: issue.number, title: issue.title, ...decision, decidedBy: 'decision' }
      }

      const response = await ctx.agent('reviewer').send(JSON.stringify(issue), {
        outputSchema: Review,
        signal: ctx.abortSignal,
      })
      const review = Review.safeParse((await response.result()).data)
      if (!review.success) {
        // Fall back to the decision rather than dropping the issue.
        return { number: issue.number, title: issue.title, ...decision, decidedBy: 'decision' }
      }
      return { number: issue.number, title: issue.title, ...review.data, confidence: decision.confidence, decidedBy: 'reviewer' }
    }))

    return {
      findings,
      reviewed: findings.filter(finding => finding.decidedBy === 'reviewer').length,
    }
  },
})
