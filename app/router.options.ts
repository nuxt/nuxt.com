import type { RouterConfig } from 'nuxt/schema'
import { createMemoryHistory, createWebHistory } from 'vue-router'
import { localeBasePath } from '#shared/utils/l10n'
import { pullBasePath } from '#shared/utils/pull'

export default <RouterConfig>{
  history: () => {
    // Outside a preview or a locale, `undefined` keeps Nuxt's own history.
    const pull = usePullPreview().value
    const locale = useDocsLocale().value
    const base = pull ? pullBasePath(pull) : locale ? localeBasePath(locale) : undefined
    if (!base) return

    return import.meta.client ? createWebHistory(base) : createMemoryHistory(base)
  }
}
