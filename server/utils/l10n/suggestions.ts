import { parseRecord } from '@diglot/core'
import { recordPath } from '@diglot/store'
import type { L10nLocale, L10nSuggestion } from '../../../shared/utils/l10n'
import type { TranslationsGit } from './git'

/** How long the list of open suggestions is reused. */
const SUGGESTIONS_TTL = 5 * 60_000

const SUGGESTION_BRANCH_RE = /^suggest\/([^/]+)\/([^/]+)$/
const RECORD_HASH_RE = /\/([0-9a-f]{16})\.json$/

interface SuggestedRecord {
  login: string
  number: number
  url: string
  head: string
}

/** The open suggestions of `locale`, by the hash of each record they change. */
async function indexSuggestions(git: TranslationsGit, locale: L10nLocale): Promise<Map<string, SuggestedRecord[]>> {
  const index = new Map<string, SuggestedRecord[]>()
  const pulls = (await git.listPulls()).flatMap((pull) => {
    const match = SUGGESTION_BRANCH_RE.exec(pull.branch)
    return match?.[2] === locale ? [{ ...pull, login: match[1]! }] : []
  })
  await Promise.all(pulls.map(async ({ login, number, url, head }) => {
    for (const path of await git.pullFiles(number)) {
      const hash = RECORD_HASH_RE.exec(path)?.[1]
      if (!hash || path !== recordPath(locale, hash)) continue
      const list = index.get(hash) ?? []
      list.push({ login, number, url, head })
      index.set(hash, list)
    }
  }))
  return index
}

const indexes = new WeakMap<TranslationsGit, Map<L10nLocale, { index: Promise<Map<string, SuggestedRecord[]>>, expiresAt: number }>>()

/** The open suggestions of `locale` in `git`, reused for five minutes. */
export function openSuggestions(git: TranslationsGit, locale: L10nLocale): Promise<Map<string, SuggestedRecord[]>> {
  let byLocale = indexes.get(git)
  if (!byLocale) indexes.set(git, byLocale = new Map())
  const cached = byLocale.get(locale)
  if (cached && cached.expiresAt > Date.now()) return cached.index

  const index = indexSuggestions(git, locale).catch((error) => {
    byLocale.delete(locale)
    throw error
  })
  byLocale.set(locale, { index, expiresAt: Date.now() + SUGGESTIONS_TTL })
  return index
}

/** The suggestions for `hashes`: the text each pull request proposes, or none for a rejection. */
export async function suggestionsFor(git: TranslationsGit, locale: L10nLocale, hashes: Iterable<string>, index?: Map<string, SuggestedRecord[]>): Promise<Record<string, L10nSuggestion[]>> {
  const suggested = index ?? await openSuggestions(git, locale)
  const result: Record<string, L10nSuggestion[]> = {}
  await Promise.all([...hashes].filter(hash => suggested.has(hash)).map(async (hash) => {
    const list = await Promise.all(suggested.get(hash)!.map(async ({ login, number, url, head }) => {
      const text = await git.read(head, recordPath(locale, hash))
      try {
        const record = text === undefined ? undefined : parseRecord(JSON.parse(text))
        if (!record) return []
        return [record.review === 'rejected' ? { login, number, url } : { login, number, url, text: record.text }]
      } catch {
        return []
      }
    }))
    if (list.flat().length) result[hash] = list.flat()
  }))
  return result
}

/** Drop the cached suggestions of `locale`, after this instance changed them. */
export function forgetSuggestions(git: TranslationsGit, locale: L10nLocale): void {
  indexes.get(git)?.delete(locale)
}
