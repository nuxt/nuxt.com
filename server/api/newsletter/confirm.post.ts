import { Resend } from 'resend'
import { z } from 'zod'

export default eventHandler(async (event) => {
  const { email, confirmation } = await readValidatedBody(event, z.object({
    email: z.string().email().trim(),
    confirmation: z.string()
  }).parse)

  const { apiKey, audienceId, secret } = useNewsletterConfig(event)

  if (generateConfirmation(secret, email) !== confirmation) {
    throw createError({
      statusCode: 400,
      message: 'Confirmation code is invalid.'
    })
  }

  const resend = new Resend(apiKey)

  const { error } = await resend.contacts.create({
    email,
    audienceId
  })

  if (error) {
    throw createError({
      statusCode: 400,
      message: error.message || 'Failed to subscribe. Please try again.'
    })
  }

  return { ok: true }
})
