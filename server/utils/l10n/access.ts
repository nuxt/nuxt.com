import type { TranslationRecord } from '@diglot/core'
import { serialiseRecord } from '@diglot/store'
import { createError, getRequestHeader, type H3Event } from 'h3'
import type { L10nLocale, L10nRole } from '../../../shared/utils/l10n'
import { TRANSLATIONS_BRANCH, TRANSLATIONS_REPO } from './bundle'
import { dryRunGit, type DryRunLog, type TranslationsGit } from './git'
import { createGitHubApp, githubTranslationsGit, isGitHubTeamMember, type GitHubApp } from './github-app'

/** The organisation whose `translators-<locale>` teams commit translations. */
const TRANSLATORS_ORG = 'nuxt'

/** How long a role shown in the editor is reused; saves always ask GitHub. */
const ROLE_TTL = 5 * 60_000

const RECORD_PATH_RE = /^([^/]+)\/segments\/[0-9a-f]{2}\/([0-9a-f]{16})\.json$/

/** The team whose members commit `locale`'s translations: `translators-fr`. */
export function translatorsTeam(locale: L10nLocale): string {
  return `translators-${locale}`
}

/** Refuse a write sent by a browser from another origin, even a sibling subdomain sharing the session cookie. */
export function assertSameOrigin(event: H3Event): void {
  const site = getRequestHeader(event, 'sec-fetch-site')
  if (site && site !== 'same-origin') {
    throw createError({ statusCode: 403, statusMessage: 'Cross-origin requests are not allowed' })
  }
}

let app: GitHubApp | undefined
let appGit: TranslationsGit | undefined

/** The GitHub App installed on the translations repository, `undefined` when it is not configured. */
export function translationsApp(): GitHubApp | undefined {
  const { id, privateKey, installationId } = useRuntimeConfig().github.app
  if (!id || !privateKey) return
  return app ??= createGitHubApp({ appId: String(id), privateKey, installationId: installationId ? String(installationId) : undefined }, { repo: TRANSLATIONS_REPO })
}

/**
 * The translations repository the write path commits to: through the App, or, where the App is not
 * configured outside production, a dry run reading the served commit and keeping every write in memory.
 */
export function translationsGit(): { git: TranslationsGit, dryRun?: DryRunLog } {
  const configured = translationsApp()
  if (configured) return { git: appGit ??= githubTranslationsGit(configured, TRANSLATIONS_REPO, TRANSLATIONS_BRANCH) }

  if (process.env.VERCEL_ENV === 'production') {
    throw createError({ statusCode: 503, statusMessage: 'Saving translations is not configured' })
  }

  const git = dryRunGit({
    head: async branch => branch === TRANSLATIONS_BRANCH ? resolveTranslationsSha() : undefined,
    async read(sha, path) {
      const [, locale, hash] = RECORD_PATH_RE.exec(path) ?? []
      if (!locale || !hash) return
      const record = (await getTranslationsTree(sha)).records(locale as L10nLocale).get(hash)
      return record ? serialiseRecord(record as TranslationRecord) : undefined
    }
  })
  return { git, dryRun: git.log }
}

const roles = new Map<string, { role: L10nRole, expiresAt: number }>()

/**
 * Whether `user` commits `locale`'s translations (a member of its team) or suggests them.
 * Without the App, admins are translators so the editor can be tried locally.
 */
export async function l10nRole(user: { username: string, role: string }, locale: L10nLocale, { cached = false } = {}): Promise<L10nRole> {
  const key = `${locale}:${user.username.toLowerCase()}`
  const hit = cached ? roles.get(key) : undefined
  if (hit && hit.expiresAt > Date.now()) return hit.role

  const configured = translationsApp()
  const member = configured
    ? await isGitHubTeamMember(configured, TRANSLATORS_ORG, translatorsTeam(locale), user.username)
    : user.role === 'admin'
  const role: L10nRole = member ? 'translator' : 'suggester'
  roles.set(key, { role, expiresAt: Date.now() + ROLE_TTL })
  return role
}
