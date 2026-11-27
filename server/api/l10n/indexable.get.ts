import type { L10nIndexable } from '#shared/utils/l10n'
import { defineHandler } from 'nuxt/server'

/** The localised pages that may be indexed, by locale. Read by every English docs page for `hreflang`. */
export default defineHandler((): Promise<L10nIndexable> => getL10nIndexable())
