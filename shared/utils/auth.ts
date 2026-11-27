import type { AuthUser } from '../types/auth'

/** Maps a Better Auth user (its `image` is stored in `users.avatar`) to the `AuthUser` the app uses. */
export function toUser(user: { id: string, name: string, email?: string | null, image?: string | null } & Record<string, unknown>): AuthUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email ?? null,
    avatar: user.image ?? '',
    username: user.username as string,
    provider: 'github',
    providerId: user.providerId as string,
    role: user.role === 'admin' ? 'admin' : 'user'
  }
}
