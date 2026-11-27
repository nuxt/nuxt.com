import { hash } from 'ohash'

/** Without the secret, confirmation codes would be computable from the email alone. */
export function useNewsletterConfig() {
  const { resend, newsletter } = useRuntimeConfig()
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
