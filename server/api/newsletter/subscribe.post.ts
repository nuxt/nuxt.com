import { Resend } from 'resend'
import { z } from 'zod'
import { withQuery, withTrailingSlash } from 'ufo'
import { checkBotId } from 'botid/server'
import { createError, defineHandler, getRequestURL, readValidatedBody } from 'nuxt/server'

export default defineHandler(async (event) => {
  const verification = await checkBotId()
  if (verification.isBot) {
    throw createError({ status: 403, statusText: 'Forbidden' })
  }

  const { email } = await readValidatedBody(event, z.object({
    email: z.string().email().trim()
  }).parse)

  const { apiKey, audienceId, secret } = useNewsletterConfig()

  const resend = new Resend(apiKey)

  // Check if the user is already subscribed
  const { data: contact } = await resend.contacts.get({ audienceId, id: email })
  if (contact && !contact.unsubscribed) {
    throw createError({
      message: 'You are already subscribed to the newsletter ❤️',
      status: 400
    })
  }

  const confirmation = generateConfirmation(secret, email)
  const origin = import.meta.dev ? getRequestURL(event).origin : 'https://nuxt.com'
  const confirmationURL = withQuery(withTrailingSlash(origin), { email, confirmation })

  const { error } = await resend.emails.send({
    from: 'Nuxt Team <team@newsletter.nuxt.com>',
    to: email,
    subject: 'Confirm your email address',
    template: {
      id: 'confirm-newsletter',
      variables: {
        confirmationURL
      }
    }
  })

  if (error) {
    throw createError({
      status: 400,
      message: error.message || 'Failed to send confirmation email. Please try again.'
    })
  }

  return { ok: true }
})
