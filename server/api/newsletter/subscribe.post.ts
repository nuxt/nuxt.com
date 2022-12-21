import { defineEventHandler, readBody } from 'h3'
import { withQuery, withTrailingSlash } from 'ufo'
import Joi from 'joi'
import { validate } from '../../utils/validation'
import { useSendgrid } from '../../lib/sendgrid'
import { generateConfirmation } from '../../utils/newsletter'

export default defineEventHandler(async (event) => {
  // Get the email from body and validate its format
  const { email } = await readBody(event)
  await validate({ email }, Joi.object({
    email: Joi.string().email().trim().required()
  }))

  // Add to contacts list
  await useSendgrid().client.request({
    method: 'PUT',
    url: '/v3/marketing/contacts',
    body: {
      // list_ids: ['74c40049-4dbc-4caf-a863-315b99d2fbca'],
      contacts: [{ email }]
    }
  }).catch((err: any) => {
    return createError({
      message: err?.response?.body?.errors?.[0]?.message || 'Invalid email',
      statusCode: 400
    })
  })

  // Send email to confirm registration
  const req = event.node.req
  const confirmation = generateConfirmation(email)
  const confirmationURL = withQuery(withTrailingSlash(req.headers.origin || 'https://nuxt.com'), { email, confirmation })
  await useSendgrid().mail.send({
    to: email,
    from: 'Nuxt Team <team@nuxt.com>',
    subject: 'Confirm your subscription to the Nuxt newsletter',
    html: `Hello,<br><br>Thank you for subscribing to the Nuxt newsletter.<br>Please complete and confirm your subscription by <a href="${confirmationURL}">clicking here</a>.<br><br>Have a wonderful day.<br>The <a href="https://nuxt.com">Nuxt</a> team.`
  })

  return { ok: true }
})
