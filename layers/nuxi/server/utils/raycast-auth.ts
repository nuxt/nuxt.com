import { createHash, randomBytes } from 'node:crypto'

const TOKEN_TTL = 30 * 24 * 60 * 60
interface Credential {
  userId: string
  expiresAt: string
}
interface CredentialStorage {
  get: (key: string) => Promise<unknown>
  set: (key: string, value: Credential, options: { ttl: number }) => Promise<unknown>
  del: (key: string) => Promise<unknown>
}

// Keep preview connections separate from production, even when KV is shared.
function credentialKey(token: string) {
  const environment = process.env.VERCEL_ENV ?? 'development'
  const branch = environment === 'preview' ? process.env.VERCEL_GIT_COMMIT_REF ?? process.env.VERCEL_URL : ''
  return `nuxi:raycast:${environment}:${branch ?? ''}:${createHash('sha256').update(token).digest('hex')}`
}

export async function issueRaycastCredential(storage: CredentialStorage, userId: string) {
  const token = `nuxi_rc_${randomBytes(32).toString('base64url')}`
  const expiresAt = new Date(Date.now() + TOKEN_TTL * 1000).toISOString()
  await storage.set(credentialKey(token), { userId, expiresAt }, { ttl: TOKEN_TTL })
  return { token, expiresAt, expiresIn: TOKEN_TTL }
}

export async function readRaycastCredential(storage: CredentialStorage, token: string) {
  if (!/^nuxi_rc_[\w-]{43}$/.test(token)) return
  const value = await storage.get(credentialKey(token)) as Credential | null
  if (!value || !value.userId || !(Date.parse(value.expiresAt) > Date.now())) return
  return value
}

export async function revokeRaycastCredential(storage: CredentialStorage, token: string) {
  if (/^nuxi_rc_[\w-]{43}$/.test(token)) await storage.del(credentialKey(token))
}
