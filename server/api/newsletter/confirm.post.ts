import { z, useValidatedBody } from 'h3-zod'

export default eventHandler(async (event) => {
  // Get the email from body
  const { email, confirmation } = await useValidatedBody(event, {
    email: z.string().email().trim(),
    confirmation: z.string()
  })

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
