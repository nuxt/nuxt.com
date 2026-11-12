import { createContentClient, type ContentFetch } from 'comark-content/client'
import { instanceBasePath, type ContentInstanceKey } from '#shared/utils/content'
import { instancePullPath, instanceRepo } from '#shared/utils/pull'
import { l10nContentBasePath } from '#shared/utils/l10n'

type ContentClient = ReturnType<typeof createContentClient>

const clients = new Map<ContentInstanceKey, ContentClient>()

const contentFetch: ContentFetch = <T>(url: string, options?: Record<string, any>) => $fetch<T>(url, options) as Promise<T>

/**
 * Client for one content instance — the app-side mirror of the server's `getInstanceAtHead()`:
 * - `site` (nuxt.com's own content: blog, deploy, landing pages…)
 * - `examples` (code examples)
 * - `docs:<version>` (one instance per docs version)
 * - `cli:<version>` (one instance per CLI version)
 * - `module-builder:<version>` (one instance per docs version's Module Builder docs)
 *
 * Under a locale, the docs and the references grafted into them are read localised.
 */
export function useContent(key: ContentInstanceKey): ContentClient {
  const locale = useDocsLocale().value
  if (locale && (key.startsWith('docs:') || key.startsWith('cli:') || key.startsWith('module-builder:'))) {
    return createContentClient({ basePath: l10nContentBasePath(locale), fetch: contentFetch })
  }

  const pull = usePullPreview().value
  if (pull && instanceRepo(key) === pull.repo) {
    return createContentClient({ basePath: instancePullPath(key, pull), fetch: contentFetch })
  }

  let client = clients.get(key)
  if (!client) {
    client = createContentClient({ basePath: instanceBasePath(key), fetch: contentFetch })
    clients.set(key, client)
  }
  return client
}
