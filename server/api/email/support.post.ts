import Joi from 'joi'
import { useEmail, sendEmail } from '../../utils/emails'
import { validate } from '../../utils/validation'

const bodySchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().trim().required(),
  website: Joi.string().trim().required(),
  companySize: Joi.string().trim().required(),
  message: Joi.string().trim().required()
})

export default defineEventHandler(async (event) => {
  const reqBody = await useBody(event)
  const body = await validate(reqBody, bodySchema)

  const to = {
    Email: 'support@nuxt.com',
    Name: 'Nuxt Support'
  }
  const replyTo = {
    Email: body.email,
    Name: `${body.name}`
  }
  const subject = `${body.name} needs support ${body.website}`
  const html = await useEmail('support')

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
