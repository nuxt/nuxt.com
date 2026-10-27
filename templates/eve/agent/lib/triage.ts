import { decide } from 'eve/ai'
import { z } from 'zod'
import { issues, type Issue } from './issues'

export const CATEGORIES = ['bug', 'feature', 'docs', 'maintenance'] as const
export const PRIORITIES = ['high', 'normal', 'low'] as const

/** Decisions below this confidence escalate to the reviewer subagent. */
export const CONFIDENCE_THRESHOLD = 0.7

export const DECISION_MODEL = 'openai/gpt-6-luna-decisions'

/** What the reviewer subagent returns for one issue. */
export const Review = z.object({
  category: z.enum(CATEGORIES),
  priority: z.enum(PRIORITIES),
  summary: z.string().min(1).max(240),
})
export type Review = z.infer<typeof Review>

export interface Decision {
  category: (typeof CATEGORIES)[number]
  priority: (typeof PRIORITIES)[number]
  /** The weaker of the two answers' top probability, from 0 to 1. */
  confidence: number
}

export interface Finding extends Decision {
  number: number
  title: string
  summary?: string
  decidedBy: 'decision' | 'reviewer'
}

export async function loadIssues(): Promise<Issue[]> {
  'use step'
  return issues
}

/**
 * Asks a decision model for a typed category and priority per issue: no conversation, no tools.
 * It runs as a step, so a replayed workflow reuses the recorded answers.
 */
export async function decideIssues(batch: Issue[], signal?: AbortSignal): Promise<Decision[]> {
  'use step'
  // An answer without probabilities has no confidence, so the issue escalates.
  const top = (probabilities?: Record<string, number>) => probabilities ? Math.max(...Object.values(probabilities)) : 0

  return Promise.all(batch.map(async (issue) => {
    const { answers } = await decide({
      model: DECISION_MODEL,
      signal,
      state: { title: issue.title, body: issue.body },
      questions: {
        category: {
          type: 'choice',
          instructions: 'What kind of issue is this?',
          criteria: {
            bug: 'Something is broken or behaves incorrectly',
            feature: 'A request for new capability',
            docs: 'Documentation is missing or wrong',
            maintenance: 'Tests, refactors, dependencies, or chores',
          },
        },
        priority: {
          type: 'choice',
          instructions: 'How urgent is it for users?',
          criteria: {
            high: 'Breaks users or blocks work now',
            normal: 'Should be fixed in the normal course of work',
            low: 'Minor or nice to have',
          },
        },
      },
    })

    return {
      category: answers.category.choice,
      priority: answers.priority.choice,
      confidence: Math.min(top(answers.category.probabilities), top(answers.priority.probabilities)),
    }
  }))
}
