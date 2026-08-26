/** The server-side twin of the app's `listByDir()`. */
export async function listByDir<T extends Record<string, any> = Record<string, any>>(path: string) {
  const content = await getInstance('site')
  const items = await content.list('site')
  const prefix = `${path}/`

  return items
    .filter(item => item.path.startsWith(prefix) && !item.path.split('/').pop()!.startsWith('.'))
    .sort((a, b) => a.path.localeCompare(b.path))
    .map(item => ({ ...(item.data as T), path: item.path, stem: item.meta.stem, extension: item.meta.extension }))
}
