import type { feedback } from 'hub:db:schema'

export type Feedback = typeof feedback.$inferSelect
export type NewFeedback = typeof feedback.$inferInsert
export type PublicFeedback = Omit<Feedback, 'fingerprint'>
