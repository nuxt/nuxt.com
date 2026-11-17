import type { NavigationItem } from 'comark-content'
import { navigationPath } from '#shared/utils/content'
import { pullNavigationPath } from '#shared/utils/pull'
import { l10nNavigationPath } from '#shared/utils/l10n'

/**
 * The navigation of the active docs version. Docs pages await it, so it is server-rendered there.
 * Other pages only need it for the search palette: `deferred` keeps it out of their HTML payload
 * (about 80 KB) and fetches it once the app is idle. Both share the `navigation:<version>` key.
 */
export function useDocsNavigation({ deferred = false } = {}) {
  const { version } = useDocsVersion()
  const pull = usePullPreview()
  const locale = useDocsLocale()

  const navigation = useFetch<NavigationItem[]>(() => {
    if (pull.value) return pullNavigationPath(version.value, pull.value)
    return locale.value ? l10nNavigationPath(locale.value, version.value) : navigationPath(version.value)
  }, { key: () => `navigation:${version.value}`, server: !deferred, immediate: !deferred })

  // Not `lazy`, which still starts the request while the page mounts.
  if (deferred && import.meta.client) {
    onNuxtReady(() => {
      if (!navigation.data.value) navigation.execute()
    })
  }

  return navigation
}
