export interface LivePreview {
  id: string
  url: string
  template: { slug: string, name: string }
  /** The route the visitor is on inside the preview. */
  path?: string
  /** The last error the app threw after it mounted. */
  error?: string
}

export type LivePreviewEditor = 'off' | 'starting' | 'on' | 'failed'

/** What the preview shows while `nuxt dev` starts, in order. */
export const LIVE_PREVIEW_EDIT_STEPS = ['Starting nuxt dev', 'Bundling the app', 'Switching over']

export interface LivePreviewActivity {
  id: string
  label: string
  next?: string
  state: 'running' | 'done' | 'failed'
}

/** The live preview running on a template page, shared so other features can follow it and drive it. */
export function useLivePreview() {
  const preview = useState<LivePreview | null>('live-preview', () => null)
  const navigation = useState<{ path: string, id: number } | null>('live-preview-navigation', () => null)
  const editor = useState<LivePreviewEditor>('live-preview-editor', () => 'off')
  const editStep = useState('live-preview-edit-step', () => 0)
  const editError = useState('live-preview-edit-error', () => '')
  const editRequest = useState('live-preview-edit-request', () => 0)
  /** Bumped to reload the frame, once a change restarted the dev server or the visitor asks for it. */
  const reloadRequest = useState('live-preview-reload-request', () => 0)
  const activity = useState<LivePreviewActivity | null>('live-preview-activity', () => null)

  /** Loads another server of the same sandbox out of sight and swaps over once it mounts. */
  function serveFrom(url: string) {
    if (preview.value && preview.value.url !== url && url.startsWith('https://')) preview.value = { ...preview.value, url }
  }

  function navigate(path: string) {
    if (path.startsWith('/') && path !== preview.value?.path) navigation.value = { path, id: (navigation.value?.id ?? 0) + 1 }
  }

  function startEditing() {
    if (preview.value && (editor.value === 'off' || editor.value === 'failed')) editRequest.value++
  }

  function clientContext() {
    if (!preview.value) return undefined
    const { id, template, path, error } = preview.value
    return [
      `Live preview: sandbox ${id}, template "${template.name}" (${template.slug})`,
      `Live preview page: ${path || '/'}`,
      error && `Live preview error: ${error.slice(0, 500)}`
    ].filter(Boolean).join('\n')
  }

  return { preview, navigation, editor, editStep, editError, editRequest, reloadRequest, activity, serveFrom, navigate, startEditing, clientContext }
}
