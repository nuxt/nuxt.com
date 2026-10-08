import { createContentClient, type ContentFetch } from 'comark-content/client'
import { instanceBasePath, type ContentInstanceKey } from '#shared/utils/content'
import { instancePullPath, instanceRepo } from '#shared/utils/pull'

type ContentClient = ReturnType<typeof createContentClient>

const clients = new Map<ContentInstanceKey, ContentClient>()

const contentFetch: ContentFetch = <T>(url: string, options?: Record<string, any>) => $fetch<T>(url, options) as Promise<T>

/**
 * Client for one content instance — the app-side mirror of the server's `getInstanceAtHead()`:
 * - `site` (nuxt.com's own content: blog, deploy, landing pages…)
 * - `examples` (code examples)
 * - `docs:<version>` (one instance per docs version)
 * - `cli:<version>` (one instance per CLI version)
 */
export function useContent(key: ContentInstanceKey): ContentClient {
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
