import { countWords } from '@diglot/core'
import type { L10nBundle } from './bundle'

/** What one login did in a locale: segments by action, and the source words of those segments. */
export interface L10nContributions {
  edited: number
  verified: number
  rejected: number
  words: number
}

/**
 * Who edited, verified and rejected the records of a bundle, by lowercased GitHub login.
 * A record counts for its editor while it is `edited`, and for the login in `verifiedBy` or `rejectedBy`.
 */
export function l10nContributors(bundle: L10nBundle): Record<string, L10nContributions> {
  const logins = new Map<string, L10nContributions>()

  for (const hash of bundle.hashes()) {
    const record = bundle.record(hash)
    if (!record) continue
    const actions = [
      [record.review === 'edited' ? record.by : undefined, 'edited'],
      [record.verifiedBy?.by, 'verified'],
      [record.rejectedBy?.by, 'rejected']
    ] as const
    const touched = new Set<L10nContributions>()
    for (const [login, action] of actions) {
      if (!login) continue
      const key = login.toLowerCase()
      let entry = logins.get(key)
      if (!entry) logins.set(key, entry = { edited: 0, verified: 0, rejected: 0, words: 0 })
      entry[action]++
      touched.add(entry)
    }
    if (!touched.size) continue
    const words = countWords(record.source)
    for (const entry of touched) entry.words += words
  }

  return Object.fromEntries(logins)
}
