import Joi from 'joi'
import { sendMail } from '~/server/utils/mailjet'
import { validateBody } from '~/server/utils'
import { createMailBody } from '~/server/utils/supportEmail'

const bodySchema = Joi.object({
  name: Joi.string().trim().required(),
  email: Joi.string().email().trim().required(),
  website: Joi.string().trim().required(),
  companySize: Joi.string().trim().required(),
  message: Joi.string().trim().required()
})

export default defineEventHandler(async (event) => {
  const body = await useBody(event)

  const sanitisedBody = await validateBody(body, bodySchema)

  await sendMail(createMailBody(sanitisedBody))

  return {}
})
