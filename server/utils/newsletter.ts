import { hash } from 'ohash'
import type { H3Event } from 'h3'

export function generateConfirmation(event: H3Event, email: string) {
  return hash({ email, secret: useRuntimeConfig(event).newsletter.secret })
}
