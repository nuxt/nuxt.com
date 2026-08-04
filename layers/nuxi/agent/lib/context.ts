type AuthAttributes = Readonly<Record<string, string | readonly string[]>>

/** Raw per-request auth principal, as eve channels build it (mirrors eve's `SessionAuthContext`). */
export interface AuthContext {
  issuer?: string
  principalId?: string
  principalType?: string
  attributes?: AuthAttributes
}

export type Surface = 'web' | 'slack' | 'discord' | 'schedule' | 'unknown'

export interface Person {
  readonly id: string
  readonly name?: string
  readonly isBot: boolean
}

export interface Channel {
  readonly id: string
}

export interface Context {
  readonly surface: Surface
  /** null only for system principals (schedule) — anonymous web visitors still have a person. */
  readonly person: Person | null
  /** null on surfaces with no channel concept (web, schedule). */
  readonly channel: Channel | null
  readonly raw: AuthContext
}

function attr(auth: AuthContext, key: string): string | undefined {
  const value = auth.attributes?.[key]
  return typeof value === 'string' ? value : undefined
}

/** Single source of truth for "who"/"where" a session comes from — admin mode, instructions, and gateway tags all key off this. */
export function resolveContext(auth: AuthContext | null | undefined): Context {
  if (!auth) return { surface: 'unknown', person: null, channel: null, raw: {} }

  if (auth.principalId === 'eve:app' && auth.principalType === 'runtime') {
    return { surface: 'schedule', person: null, channel: null, raw: auth }
  }

  if (auth.issuer === 'slack' || auth.issuer?.startsWith('slack:')) {
    const channelId = attr(auth, 'channel_id')
    return {
      surface: 'slack',
      person: {
        id: attr(auth, 'user_id') ?? auth.principalId ?? 'unknown',
        name: attr(auth, 'full_name') ?? attr(auth, 'user_name'),
        isBot: attr(auth, 'author_type') === 'bot'
      },
      channel: channelId ? { id: channelId } : null,
      raw: auth
    }
  }

  if (auth.issuer === 'discord' || auth.issuer?.startsWith('discord:')) {
    const channelId = attr(auth, 'channel_id')
    return {
      surface: 'discord',
      person: { id: auth.principalId ?? 'unknown', name: attr(auth, 'username'), isBot: false },
      channel: channelId ? { id: channelId } : null,
      raw: auth
    }
  }

  if (auth.issuer === 'nuxt.com') {
    return {
      surface: 'web',
      person: {
        id: auth.principalId ?? 'unknown',
        name: attr(auth, 'login') ?? attr(auth, 'name'),
        isBot: false
      },
      channel: null,
      raw: auth
    }
  }

  return { surface: 'unknown', person: null, channel: null, raw: auth }
}
