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
