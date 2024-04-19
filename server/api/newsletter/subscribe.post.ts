import { z } from 'zod'
import { withQuery, withTrailingSlash } from 'ufo'

export default eventHandler(async (event) => {
  // Get the email from body and validate its format
  const { email } = await readValidatedBody(event, z.object({
    email: z.string().email().trim()
  }).parse)

  const listId = process.env.NUXT_SENDGRID_LIST_ID
  if (!listId) {
    throw createError({
      statusCode: 500,
      message: 'Missing NUXT_SENDGRID_LIST_ID env variable'
    })
  }

  // Check if already in contact list
  await sendgrid.searchContact(email)
    .catch((err) => {
      if (err.statusCode !== 404) {
        throw createError({
          message: err?.data?.errors?.[0]?.message || 'Sorry, we could not verify our contact list.',
          statusCode: 400
        })
      }
    }).then((res = {}) => {
      if (res[email]?.contact?.list_ids?.includes(listId)) {
        throw createError({
          message: 'You are already subscribed to the newsletter ❤️',
          statusCode: 400
        })
      }
    })
  // Add to global contacts first
  await sendgrid.addContact(email)
    .catch((err) => {
      throw createError({
        message: err?.data?.errors?.[0]?.message || 'The email is invalid.',
        statusCode: 400
      })
    })

  // Send email to confirm registration
  const confirmation = generateConfirmation(email)
  const confirmationURL = withQuery(withTrailingSlash(getHeader(event, 'origin') || 'https://nuxt.com'), { email, confirmation })

  await sendgrid.sendEmail({
    personalizations: [
      {
        to: [{ email }]
      }
    ],
    from: {
      name: 'Nuxt Team',
      email: 'team@nuxt.com'
    },
    subject: 'Confirm your subscription to the Nuxt newsletter',
    content: [
      {
        type: 'text/html',
        value: `Hello,<br><br>Thank you for subscribing to the Nuxt newsletter.<br>Please complete and confirm your subscription by <a href="${confirmationURL}">clicking here</a>.<br><br>Have a wonderful day.<br>The <a href="https://nuxt.com">Nuxt</a> team.`
      }
    ]
  })

  return { ok: true }
})
