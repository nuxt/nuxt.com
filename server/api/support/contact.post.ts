import type { H3Event } from 'h3'
import { defineEventHandler } from 'h3'
import { z } from 'zod'

export default defineEventHandler(async (event: H3Event) => {
  const { name, email, company, body, token } = await readValidatedBody(event, z.object({
    name: z.string().min(1),
    email: z.string().email().trim().min(1),
    company: z.string().min(1),
    body: z.string().min(1),
    token: z.string().min(1)
  }).parse)

  const response = await verifyTurnstileToken(token, event)
  if (!response.success) {
    throw createError({
      statusCode: 500,
      message: 'Your message could not be sent, please contact us directly at experts@nuxt.com'
    })
  }

  const templateId = 'd-d9f7e91ee529458494e16ecfa3b499c1'
  let to = {
    email: 'experts@nuxt.com',
    name: 'Nuxt Experts'
  }
  if (process.dev && process.env.NUXT_CONTACT_EMAIL) {
    to.email = process.env.NUXT_CONTACT_EMAIL
  }

  await sendgrid.sendEmail({
    personalizations: [{
      to: [to],
      dynamic_template_data: { email, name, company, body }
    }],
    from: {
      email: 'team@nuxt.com',
      name: 'Nuxt Support'
    },
    subject: `[Nuxt Support] ${company}`,
    replyTo: {
      email,
      name: name
    },
    content: [
      {
        type: 'text/plain',
        value: body
      }
    ],
    template_id: templateId,
  })

  return { ok: true }
})
