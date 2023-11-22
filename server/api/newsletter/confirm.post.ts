import { z } from 'zod'

export default eventHandler(async (event) => {
  // Get the email from body
  const { email, confirmation } = await readValidatedBody(event, z.object({
    email: z.string().email().trim(),
    confirmation: z.string()
  }).parse)

  const listId = process.env.NUXT_SENDGRID_LIST_ID
  if (!listId) {
    throw createError({
      statusCode: 500,
      message: 'Missing NUXT_SENDGRID_LIST_ID env variable'
    })
  }

  // Validate confirmation code
  if (generateConfirmation(email) !== confirmation) {
    throw createError({
      statusCode: 400,
      message: 'Confirmation code is invalid.'
    })
  }

  // Add to contacts list
  await sendgrid.addContactToList(email, listId).catch((err: any) => {
    throw createError({
      message: err?.response?.body?.errors?.[0]?.message || 'Invalid email',
      statusCode: 400
    })
  })

  return { ok: true }
})
