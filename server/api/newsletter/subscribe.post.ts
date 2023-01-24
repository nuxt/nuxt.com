import { defineEventHandler, readBody, createError } from 'h3'
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

  // Check if already in contact list
  await useSendgrid().client.request({
    method: 'POST',
    url: '/v3/marketing/contacts/search/emails',
    body: {
      emails: [email]
    }
  }).catch((err) => {
    if (err.code !== 404) {
      throw createError({
        message: err?.response?.body?.errors?.[0]?.message || 'Could not verify contacts list',
        statusCode: 400
      })
    }
  }).then(([_, body] = []) => {
    if (body && body.result && body.result[email]?.contact?.list_ids?.includes(useSendgrid().listId)) {
      throw createError({
        message: 'Already subscribed to the newsletter',
        statusCode: 400
      })
    }
  })
  // Add to global contacts first
  await useSendgrid().client.request({
    method: 'PUT',
    url: '/v3/marketing/contacts',
    body: {
      contacts: [{ email }]
    }
  }).catch((err) => {
    throw createError({
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
