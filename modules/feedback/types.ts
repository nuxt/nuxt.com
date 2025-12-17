import { z } from 'zod'

export interface FeedbackPublicRuntimeConfig {
  adminPath: string
}

declare module 'nuxt/schema' {
  interface PublicRuntimeConfig {
    feedback: FeedbackPublicRuntimeConfig
  }
}

export const FEEDBACK_RATINGS = [
  'very-helpful',
  'helpful',
  'not-helpful',
  'confusing'
] as const

export type FeedbackRating = typeof FEEDBACK_RATINGS[number]

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

export interface FeedbackSubmission {
  rating: FeedbackRating
  feedback?: string
  path: string
  title: string
  stem: string
}

export type FeedbackItem = FeedbackSubmission & {
  id: number
  updatedAt: Date
  createdAt: Date
  country?: string
}

export type PageAnalytic = {
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

export interface FeedbackModuleOptions {
  /**
   * Path prefix for admin routes
   * @default '/_feedback/admin'
   */
  adminPath?: string
}

/**
 * Context passed to the 'feedback:authorize' hook
 */
export interface FeedbackAuthorizeContext {
  /** GitHub user object from OAuth */
  user: {
    id: number
    login: string
    name: string | null
    email: string | null
    avatar_url: string
  }
  /** Set to false to deny access (default: true) */
  allowed: boolean
}

declare module 'nitropack/types' {
  interface NitroRuntimeHooks {
    'feedback:authorize': (ctx: FeedbackAuthorizeContext) => void | Promise<void>
  }
}
