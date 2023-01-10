import { createError } from 'h3'
import Joi from 'joi'

export async function validate (body: Object, schema: Joi.Schema) {
  let sanitisedBody

  try {
    sanitisedBody = await schema.validateAsync(body, {
      // stops to first error
      abortEarly: true,
      // allows fields not defined in schema
      allowUnknown: true,
      // applies trim to fields
      convert: true
    })
  } catch (err) {
    let message = 'Invalid body'
    // uses Joi error message if any
    if (err?.details?.length) {
      message = err.details[0].message
    }
    throw createError({
      statusCode: 400,
      message,
      data: {
        code: 'invalid-body'
      }
    })
  }

  return sanitisedBody
}
