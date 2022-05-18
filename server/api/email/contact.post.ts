import Joi from 'joi'
import { sendMail } from '~/server/utils/mailjet'
import { validateBody } from '~/server/utils'
import { createMailBody } from '~/server/utils/contactEmail'

const bodySchema = Joi.object({
  firstname: Joi.string().trim().required(),
  lastname: Joi.string().trim().required(),
  email: Joi.string().email().trim().required(),
  website: Joi.string().trim().required(),
  help: Joi.string().trim().required(),
  message: Joi.string().trim().required()
})

export default defineEventHandler(async (event) => {
  const body = await useBody(event)

  const sanitisedBody = await validateBody(body, bodySchema)

  await sendMail(createMailBody(sanitisedBody))

  return {}
})
