import Joi from 'joi'
import { useEmail, sendEmail } from '~/server/utils/emails'
import { validate } from '~/server/utils/validation'

const bodySchema = Joi.object({
  firstname: Joi.string().trim().required(),
  lastname: Joi.string().trim().required(),
  email: Joi.string().email().trim().required(),
  company: Joi.string().trim().required(),
  offer: Joi.string().trim().required(),
  message: Joi.string().trim().required()
})

export default defineEventHandler(async (event) => {
  const reqBody = await useBody(event)
  const body = await validate(reqBody, bodySchema)

  const to = {
    Email: 'career@nuxt.com',
    Name: 'Nuxt Career'
  }
  const replyTo = {
    Email: body.email,
    Name: `${body.firstname} ${body.lastname}`
  }
  const subject = `${body.firstname} ${body.lastname} applied for ${body.offer}`
  const html = await useEmail('career')

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
