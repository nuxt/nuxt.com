import Joi from 'joi'
import { useEmail, sendEmail } from '../../utils/emails'
import { validate } from '../../utils/validation'
import { defineEventHandler } from '#imports'

const bodySchema = Joi.object({
  firstname: Joi.string().trim().required(),
  lastname: Joi.string().trim().required(),
  email: Joi.string().email().trim().required(),
  website: Joi.string().trim().required(),
  subject: Joi.string().trim().required(),
  message: Joi.string().trim().required()
})

export default defineEventHandler(async (event) => {
  const reqBody = await useBody(event)
  const body = await validate(reqBody, bodySchema)

  const to = {
    Email: 'contact@nuxt.com',
    Name: 'Nuxt Contact'
  }
  const replyTo = {
    Email: body.email,
    Name: `${body.firstname} ${body.lastname}`
  }
  const subject = `${body.firstname} ${body.lastname}: ${body.subject}`
  const html = await useEmail('contact')

  await sendEmail({
    Messages: [{
      From: to,
      To: [to],
      ReplyTo: replyTo,
      Variables: body,
      TemplateLanguage: true,
      Subject: subject,
      HTMLPart: html
    }]
  })

  return {}
})
