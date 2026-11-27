import type { AuthUser } from '#shared/types'

/**
 * The signed-in user, loaded in the browser only (see `app/plugins/session.client.ts`): pages are
 * cached with ISR, so a session read while rendering would be served to every visitor.
 */
export function useUserSession() {
  const user = useState<AuthUser | null>('user-session', () => null)
  const ready = useState('user-session-ready', () => false)

  async function fetch() {
    const session = await $fetch<{ user: Parameters<typeof toUser>[0] } | null>('/api/auth/get-session', { retry: false }).catch(() => null)
    user.value = session ? toUser(session.user) : null
    ready.value = true
  }

  async function clear() {
    await $fetch('/api/auth/sign-out', { method: 'POST', body: {} })
    user.value = null
  }

  return {
    ready: computed(() => ready.value),
    loggedIn: computed(() => Boolean(user.value)),
    user: computed(() => user.value),
    fetch,
    clear
  }
}
