import { slackApi } from './api.js'

/**
 * When set, only members of this workspace reach Nuxi. Slack Connect channels deliver messages
 * from people in other companies, and Slack callers get admin mode (`identity/admin-mode.ts`).
 */
export function homeSlackTeamId(): string | undefined {
  return process.env.SLACK_TEAM_ID?.trim() || undefined
}

export function isHomeSlackTeam(teamId: string | undefined): boolean {
  const home = homeSlackTeamId()
  return home === undefined || teamId === home
}

export interface SlackMember {
  /** Display name for `Context.person.name`, when Slack has one. */
  readonly name: string | undefined
  /** Active, not a guest, and in the home workspace. */
  readonly fullMember: boolean
}

interface SlackUserInfoResponse {
  ok: boolean
  error?: string
  user?: {
    name?: string
    real_name?: string
    deleted?: boolean
    is_bot?: boolean
    is_restricted?: boolean
    is_ultra_restricted?: boolean
    team_id?: string
    profile?: {
      display_name?: string
      real_name?: string
    }
  }
}

const MEMBER_TTL_MS = 10 * 60 * 1000
const memberCache = new Map<string, { member: SlackMember, expiresAt: number }>()

/** Tests only. */
export function resetSlackMemberCache() {
  memberCache.clear()
}

/**
 * One `users.info` call gives both the caller's name and whether they may use Nuxi. Guests
 * (`is_restricted`, `is_ultra_restricted`), deactivated accounts and people from other
 * workspaces are not full members. Throws when Slack can't be asked, so callers fail closed;
 * only answers are cached, so an outage doesn't lock someone out for the whole TTL.
 */
export async function lookupSlackMember(userId: string): Promise<SlackMember> {
  const cached = memberCache.get(userId)
  if (cached && cached.expiresAt > Date.now()) return cached.member

  const data = await slackApi<SlackUserInfoResponse>('users.info', { user: userId })
  let member: SlackMember
  if (data.ok && data.user) {
    const { user } = data
    member = {
      name: user.profile?.display_name || user.profile?.real_name || user.real_name || user.name || undefined,
      fullMember: user.deleted !== true
        && user.is_bot !== true
        && user.is_restricted !== true
        && user.is_ultra_restricted !== true
        && isHomeSlackTeam(user.team_id)
    }
  } else if (data.error === 'user_not_found') {
    member = { name: undefined, fullMember: false }
  } else {
    throw new Error(`Slack users.info failed: ${data.error ?? 'unknown error'}`)
  }

  memberCache.set(userId, { member, expiresAt: Date.now() + MEMBER_TTL_MS })
  return member
}

/** Fail-closed wrapper for inbound hooks: a lookup error drops the message instead of letting it through. */
export async function findFullSlackMember(userId: string | undefined): Promise<SlackMember | null> {
  if (!userId) return null
  try {
    const member = await lookupSlackMember(userId)
    return member.fullMember ? member : null
  } catch (error) {
    console.error('[nuxi:slack] member check failed', { userId, error })
    return null
  }
}
