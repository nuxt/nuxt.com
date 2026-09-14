import { createContentClient } from 'comark-content/client'
import { instanceBasePath, type ContentInstanceKey } from '#shared/utils/content'

type ContentClient = ReturnType<typeof createContentClient>

const clients = new Map<ContentInstanceKey, ContentClient>()

/**
 * Client for one content instance — the app-side mirror of the server's `getInstanceAtHead()`:
 * - `site` (nuxt.com's own content: blog, deploy, landing pages…)
 * - `examples` (code examples)
 * - `docs:<version>` (one instance per docs version)
 * - `cli:<version>` (one instance per CLI version)
 */
export function useContent(key: ContentInstanceKey): ContentClient {
  let client = clients.get(key)
  if (!client) {
    client = createContentClient({ basePath: instanceBasePath(key), fetch: $fetch })
    clients.set(key, client)
  }
  return client
}
