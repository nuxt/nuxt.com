import type { L10nLocale } from '#shared/utils/l10n'

/**
 * The locale this page is rendered in (`/fr/docs/…`), `undefined` for English.
 * Set once per request by `plugins/l10n.server.ts`: a locale is only left by a full reload.
 */
export function useDocsLocale() {
  return useState<L10nLocale | undefined>('docs-locale', () => undefined)
}
