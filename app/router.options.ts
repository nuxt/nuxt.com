import type { RouterConfig } from 'nuxt/schema'
import { createMemoryHistory, createWebHistory } from 'vue-router'
import { pullBasePath } from '#shared/utils/pull'

export default <RouterConfig>{
  history: () => {
    // Outside a preview, `undefined` keeps Nuxt's own history.
    const pull = usePullPreview().value
    if (!pull) return

    const base = pullBasePath(pull)
    return import.meta.client ? createWebHistory(base) : createMemoryHistory(base)
  }
}
