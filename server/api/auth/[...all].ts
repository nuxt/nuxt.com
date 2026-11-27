import { defineHandler } from 'nuxt/server'

/** Better Auth's endpoints: OAuth callbacks, `get-session`, `sign-out`… */
export default defineHandler(async (event) => {
  const auth = await useAuth()
  return auth.handler(event.req)
})
