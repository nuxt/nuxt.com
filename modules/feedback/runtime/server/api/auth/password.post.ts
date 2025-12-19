import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { password } = await readValidatedBody(event, z.object({
    password: z.string().min(1)
  }).parse)
  const { feedback: { adminPassword } } = useRuntimeConfig(event)

  if (!adminPassword) {
    throw createError({
      statusCode: 403,
      message: 'Password authentication is not configured'
    })
  }

  if (!password || password !== adminPassword) {
    throw createError({
      statusCode: 401,
      message: 'Invalid password'
    })
  }

  await setUserSession(event, {
    user: {
      login: 'Admin',
      avatar_url: ''
    }
  })

  return { success: true }
})
