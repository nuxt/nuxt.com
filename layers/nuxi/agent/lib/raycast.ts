import { RaycastHttpError } from 'eve-raycast/channel'
import type { RaycastAuth } from 'eve-raycast/channel'
import type { AuthContext } from './identity/context.js'
import { appOrigin, internalHeaders } from './internal-api.js'

export interface RaycastAccount {
  id: string
  name: string
  login: string
  role: 'admin' | 'user'
  avatarUrl: string
  expiresAt: string
}

export function raycastAuth(account: RaycastAccount): AuthContext {
  return {
    issuer: 'raycast', authenticator: 'github', principalType: 'user', principalId: account.id,
    attributes: { name: account.name, login: account.login, role: account.role }
  }
}

export async function raycastCredential(request: Request, action = 'authenticate'): Promise<RaycastAccount> {
  const authorization = request.headers.get('authorization') ?? ''
  if (!/^Bearer nuxi_rc_[\w-]{43}$/.test(authorization)) throw new RaycastHttpError(401)
  // Verify against this deployment's web service, including on branch previews.
  const origin = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : appOrigin()
  const response = await fetch(`${origin}/api/internal/raycast-auth`, {
    method: 'POST', headers: internalHeaders(),
    body: JSON.stringify({ action, token: authorization.slice(7) }), signal: AbortSignal.timeout(10_000)
  })
  if (!response.ok) throw new RaycastHttpError(response.status === 401 || response.status === 403 ? response.status : 503)
  return response.json() as Promise<RaycastAccount>
}

export const raycastAuthAdapter: RaycastAuth = {
  signIn: '/raycast/connect',
  async authenticate(request) {
    const account = await raycastCredential(request)
    return {
      user: { id: account.id, name: account.name, avatarUrl: account.avatarUrl },
      auth: raycastAuth(account),
      expiresAt: account.expiresAt
    }
  },
  async revoke(request) {
    await raycastCredential(request, 'revoke')
  }
}
