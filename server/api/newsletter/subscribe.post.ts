import { Resend } from 'resend'
import { z } from 'zod'

export default eventHandler(async (event) => {
  const { email } = await readValidatedBody(event, z.object({
    email: z.string().email().trim()
  }).parse)

  const { apiKey, audienceId } = useRuntimeConfig(event).resend
  if (!apiKey || !audienceId) {
    throw createError({
      statusCode: 500,
      message: 'Missing Resend configuration'
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
