import { hash } from 'ohash'
import type { H3Event } from 'h3'

/** Without the secret, confirmation codes would be computable from the email alone. */
export function useNewsletterConfig(event: H3Event) {
  const { resend, newsletter } = useRuntimeConfig(event)
  if (!resend.apiKey || !resend.audienceId || !newsletter.secret) {
    throw createError({
      statusCode: 500,
      message: 'Newsletter is not configured'
    })
  }
  return { apiKey: resend.apiKey, audienceId: resend.audienceId, secret: newsletter.secret }
}

export function generateConfirmation(secret: string, email: string) {
  return hash({ email, secret })
}
