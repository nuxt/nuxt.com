import type { H3Event } from 'h3'
import { defineEventHandler, readBody } from 'h3'
import Joi from 'joi'
import { validate } from '../utils/validation'

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody(event)

  await validate(body, Joi.object({
    company: Joi.string().required(),
    email: Joi.string().email().trim().required(),
    message: Joi.string().required()
  }))

  /* Use mailjet to send emails */

  /* Use mailjet response */

  const fakeMailjet = {
    response: 'ok'
  }

  if (fakeMailjet.response !== 'ok') {
    return createError({
      message: 'Your message could not be sent, please contact us directly at contact@nuxtlabs.com',
      statusCode: 400
    })
  }

  return {
    response: 'ok'
  }
})
