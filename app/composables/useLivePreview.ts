export interface LivePreview {
  id: string
  url: string
  template: { slug: string, name: string }
  /** The route the visitor is on inside the preview. */
  path?: string
  /** The last error the app threw after it mounted. */
  error?: string
}

/** The live preview running on a template page, shared so other features can follow it and drive it. */
export function useLivePreview() {
  const preview = useState<LivePreview | null>('live-preview', () => null)
  const navigation = useState<{ path: string, id: number } | null>('live-preview-navigation', () => null)
  /** Bumped to load the page again, out of sight until it mounts. */
  const reloadRequest = useState('live-preview-reload-request', () => 0)

  /** Loads another server of the same sandbox out of sight and swaps over once it mounts. */
  function serveFrom(url: string) {
    if (preview.value && preview.value.url !== url && url.startsWith('https://')) preview.value = { ...preview.value, url }
  }

  function navigate(path: string) {
    if (path.startsWith('/') && path !== preview.value?.path) navigation.value = { path, id: (navigation.value?.id ?? 0) + 1 }
  }

  return { preview, navigation, reloadRequest, serveFrom, navigate }
}
