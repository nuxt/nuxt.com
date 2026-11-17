import type { NavigationItem } from 'comark-content'
import { navigationPath } from '#shared/utils/content'
import { pullNavigationPath } from '#shared/utils/pull'
import { l10nNavigationPath } from '#shared/utils/l10n'

/**
 * The navigation of the active docs version. Docs pages await it, so it is server-rendered there;
 * other pages only need it for the search palette and pass `{ lazy: true, server: false }` to keep
 * it out of their HTML payload (about 80 KB). Both share the `navigation:<version>` key.
 */
export function useDocsNavigation(options: { lazy?: boolean, server?: boolean } = {}) {
  const { version } = useDocsVersion()
  const pull = usePullPreview()
  const locale = useDocsLocale()

  return useFetch<NavigationItem[]>(() => {
    if (pull.value) return pullNavigationPath(version.value, pull.value)
    return locale.value ? l10nNavigationPath(locale.value, version.value) : navigationPath(version.value)
  }, { key: () => `navigation:${version.value}`, ...options })
}
