import type { L10nIndexable } from '#shared/utils/l10n'

/** The localised pages that may be indexed, by locale. Read by every English docs page for `hreflang`. */
export default defineEventHandler((): Promise<L10nIndexable> => getL10nIndexable())
