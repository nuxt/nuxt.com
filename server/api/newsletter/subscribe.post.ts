import { Resend } from 'resend'
import { z } from 'zod'
import { withQuery, withTrailingSlash } from 'ufo'
import { confirmationEmailHtml } from '~~/server/utils/email-templates'

export default eventHandler(async (event) => {
  const { email } = await readValidatedBody(event, z.object({
    email: z.string().email().trim()
  }).parse)

  const { apiKey } = useRuntimeConfig(event).resend
  if (!apiKey) {
    throw createError({
      statusCode: 500,
      message: 'Missing Resend configuration'
    })
  }

  const confirmation = generateConfirmation(event, email)
  const confirmationURL = withQuery(withTrailingSlash(getHeader(event, 'origin') || 'https://nuxt.com'), { email, confirmation })

  const resend = new Resend(apiKey)

  const { error } = await resend.emails.send({
    from: 'Nuxt Team <team@newsletter.nuxt.com>',
    to: email,
    subject: 'Confirm your subscription to the Nuxt newsletter',
    html: confirmationEmailHtml(confirmationURL)
  })

  if (error) {
    throw createError({
      statusCode: 400,
      message: error.message || 'Failed to send confirmation email. Please try again.'
    })
  }

  return { ok: true }
})
