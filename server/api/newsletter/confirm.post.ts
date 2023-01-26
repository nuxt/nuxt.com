import { defineEventHandler, readBody, createError } from 'h3'
import Joi from 'joi'
import { validate } from '../../utils/validation'
import { useSendgrid } from '../../lib/sendgrid'
import { generateConfirmation } from '../../utils/newsletter'

export default defineEventHandler(async (event) => {
  // Get the email from body
  const { email, confirmation } = await readBody(event)
  await validate({ email, confirmation }, Joi.object({
    email: Joi.string().email().trim().required(),
    confirmation: Joi.string().required()
  }))

  // Validate confirmation code
  if (generateConfirmation(email) !== confirmation) {
    throw createError({
      statusCode: 400,
      message: 'Confirmation code is invalid.'
    })
  }

  // Add to contacts list
  await useSendgrid().client.request({
    method: 'PUT',
    url: '/v3/marketing/contacts',
    body: {
      list_ids: [useSendgrid().listId],
      contacts: [{ email }]
    }
  }).catch((err: any) => {
    throw createError({
      message: err?.response?.body?.errors?.[0]?.message || 'Invalid email',
      statusCode: 400
    })
  })

  return { ok: true }
})
