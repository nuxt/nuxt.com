import type { H3Event } from 'h3'
import { defineEventHandler, readBody } from 'h3'
import Joi from 'joi'
import sgMail from '@sendgrid/mail'
import { validate } from '../utils/validation'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event: H3Event) => {
  const body = await readBody(event)

  await validate(body, Joi.object({
    company: Joi.string().required(),
    email: Joi.string().email().trim().required(),
    agencyEmail: Joi.string().email().trim().required(),
    message: Joi.string().required()
  }))

  // Init Sendgrid client
  const { sendgrid, testEmail } = useRuntimeConfig()

  sgMail.setApiKey(sendgrid.apiKey)

  /* Template has been created in SendGrid */
  const templateId = 'd-63851cecd4884461aac709fa6e1331cd'

  /* This email has been authorized in SendGrid */
  const verifiedNuxtEmail = 'partners@nuxtlabs.com'

  const msg = {
    to: process.dev ? testEmail : body.agencyEmail,
    from: verifiedNuxtEmail,
    bcc: [verifiedNuxtEmail],
    templateId,
    dynamicTemplateData: {
      company: body.company,
      email: body.email,
      message: body.message
    }
  }

  try {
    await sgMail.send(msg)
    return {
      response: 'ok'
    }
  } catch (err) {
    throw createError({
      message: 'Your message could not be sent, please contact us directly at contact@nuxtlabs.com',
      statusCode: 400
    })
  }
})
