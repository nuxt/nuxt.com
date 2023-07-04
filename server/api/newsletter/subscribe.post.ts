import { z, useValidatedBody } from 'h3-zod'
import { withQuery, withTrailingSlash } from 'ufo'

export default eventHandler(async (event) => {
  // Get the email from body and validate its format
  const { email } = await useValidatedBody(event, {
    email: z.string().email().trim()
  })

  // Check if already in contact list
  await useSendgrid().client.request({
    method: 'POST',
    url: '/v3/marketing/contacts/search/emails',
    body: {
      emails: [email]
    }
  }).catch((err) => {
    if (err.code !== 404) {
      throw createError({
        message: err?.response?.body?.errors?.[0]?.message || 'Sorry, we could not verify our contact list.',
        statusCode: 400
      })
    }
  }).then((res) => {
    if (!res) return
    const [_, body] = res
    if (body && body.result && body.result[email]?.contact?.list_ids?.includes(useSendgrid().listId)) {
      throw createError({
        message: 'You are already subscribed to the newsletter ❤️',
        statusCode: 400
      })
    }
  })
  // Add to global contacts first
  await useSendgrid().client.request({
    method: 'PUT',
    url: '/v3/marketing/contacts',
    body: {
      contacts: [{ email }]
    }
  }).catch((err) => {
    throw createError({
      message: err?.response?.body?.errors?.[0]?.message || 'The email is invalid.',
      statusCode: 400
    })
  })

  // Send email to confirm registration
  const confirmation = generateConfirmation(email)
  const confirmationURL = withQuery(withTrailingSlash(getHeader(event, 'origin') || 'https://nuxt.com'), { email, confirmation })
  await useSendgrid().mail.send({
    to: email,
    from: 'Nuxt Team <team@nuxt.com>',
    subject: 'Confirm your subscription to the Nuxt newsletter',
    html: `Hello,<br><br>Thank you for subscribing to the Nuxt newsletter.<br>Please complete and confirm your subscription by <a href="${confirmationURL}">clicking here</a>.<br><br>Have a wonderful day.<br>The <a href="https://nuxt.com">Nuxt</a> team.`
  })

  return { ok: true }
})
