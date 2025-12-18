import { z } from 'zod'

declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    feedback: {
      adminPath: string
      hasPasswordAuth: boolean
    }
  }
  interface RuntimeConfig {
    feedback: {
      adminPassword: string
    }
  }
}

export const FEEDBACK_RATINGS = ['very-helpful', 'helpful', 'not-helpful', 'confusing'] as const

export type FeedbackRating = typeof FEEDBACK_RATINGS[number]

export const feedbackSchema = z.object({
  rating: z.enum(FEEDBACK_RATINGS),
  feedback: z.string().optional(),
  path: z.string(),
  title: z.string(),
  stem: z.string()
})

export const feedbackFormSchema = z.object({
  rating: z.enum(FEEDBACK_RATINGS).nullable(),
  feedback: z.string().refine((val) => {
    const trimmed = val.trim()
    return trimmed === '' || trimmed.length >= 10
  }, {
    message: 'Please provide at least 10 characters or leave the field empty'
  })
})

export type FeedbackInput = z.infer<typeof feedbackSchema>

export type FeedbackSubmission = FeedbackInput

export type FeedbackItem = FeedbackInput & {
  id: number
  createdAt: Date
  updatedAt: Date
  country?: string
}

export interface FeedbackOption {
  emoji: string
  label: string
  value: FeedbackRating
  score: number
}

export const FEEDBACK_OPTIONS: FeedbackOption[] = [
  { emoji: '🤩', label: 'Very helpful', value: 'very-helpful', score: 4 },
  { emoji: '🙂', label: 'Helpful', value: 'helpful', score: 3 },
  { emoji: '☹️', label: 'Not helpful', value: 'not-helpful', score: 2 },
  { emoji: '😰', label: 'Confusing', value: 'confusing', score: 1 }
]

export interface PageAnalytic {
  path: string
  total: number
  positive: number
  negative: number
  averageScore: number
  positivePercentage: number
  feedback: FeedbackItem[]
  lastFeedback: FeedbackItem
  createdAt: Date
  updatedAt: Date
}

export interface FeedbackModuleOptions {
  adminPath?: string
}

export interface FeedbackAuthorizeContext {
  user: {
    id: number
    login: string
    name: string | null
    email: string | null
    avatar_url: string
  }
  allowed: boolean
}

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    'feedback:authorize': (ctx: FeedbackAuthorizeContext) => void | Promise<void>
  }
}
