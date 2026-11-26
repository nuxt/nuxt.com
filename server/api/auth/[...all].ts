import { toWebRequest } from 'h3'

/** Better Auth's endpoints: OAuth callbacks, `get-session`, `sign-out`… */
export default defineEventHandler(async (event) => {
  const auth = await useAuth()
  return auth.handler(toWebRequest(event))
})
