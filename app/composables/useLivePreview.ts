import type { PreviewDeployEvent } from '#shared/types'

export interface LivePreview {
  id: string
  url: string
  template: { slug: string, name: string }
  /** The route the visitor is on inside the preview. */
  path?: string
  /** The last error the app threw after it mounted. */
  error?: string
}

export interface LivePreviewDeployment {
  /** The template it was deployed from: the state outlives the page, and other templates mustn't show it. */
  slug: string
  url: string
  /** Hands the project over to whoever opens it: shown only to the visitor. */
  claimUrl: string
  expiresAt: number
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
  /** The visitor's temporary Vercel deployment. Deploying again from the same preview updates its URL and claim link. */
  const deployment = useState<LivePreviewDeployment | null>('live-preview-deployment', () => null)
  const deploying = useState('live-preview-deploying', () => false)
  const deployError = useState('live-preview-deploy-error', () => '')
  /** When a preview's sandbox stops, once a deploy extended it. Keyed by preview, so a late event can't move another preview's countdown. */
  const stopsAt = useState<{ id: string, at: number } | null>('live-preview-stops-at', () => null)
  const downloading = useState('live-preview-downloading', () => false)
  /** The deploy panel shows the deploy's progress itself, so the island leaves it out while it's open. */
  const deployPanelOpen = useState('live-preview-deploy-panel-open', () => false)
  const toast = useToast()

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

  /**
   * Deploys the preview, with every edit, to Vercel without an account. The browser runs it, for the toolbar and for Nuxi alike,
   * so the claim link, which hands over the project, never enters the chat.
   */
  async function deploy() {
    const current = preview.value
    if (!current || deploying.value) return
    deploying.value = true
    deployError.value = ''
    // The build needs the memory `nuxt dev` uses: the deploy stops it, and editing starts again once it ends.
    const editing = editor.value === 'on' || editor.value === 'starting'
    try {
      const response = await fetch(`/api/templates/preview/${current.id}/deploy`, { method: 'POST' })
      let deployed = false
      await readEvents<PreviewDeployEvent>(response, (data) => {
        if (data.type === 'error') throw new Error(data.message)
        if (data.type === 'started' && preview.value?.id === current.id) stopsAt.value = { id: current.id, at: data.stopsAt }
        if (data.type === 'ready') {
          deployment.value = { slug: current.template.slug, url: data.url, claimUrl: data.claimUrl, expiresAt: data.expiresAt }
          deployed = true
        }
      }, 'The deploy failed.')
      if (!deployed) throw new Error('The deploy failed.')
    } catch (err: any) {
      deployError.value = err instanceof SyntaxError ? 'The deploy failed.' : err?.message || 'The deploy failed.'
    } finally {
      deploying.value = false
      if (editing && preview.value?.id === current.id) {
        editor.value = 'off'
        editRequest.value++
      }
    }
  }

  async function download() {
    const current = preview.value
    if (!current || downloading.value) return
    downloading.value = true
    try {
      const zip = await $fetch<Blob>(`/api/templates/preview/${current.id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(zip)
      const link = document.createElement('a')
      link.href = url
      link.download = `${current.template.slug}.zip`
      document.body.appendChild(link)
      link.click()
      link.remove()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch {
      toast.add({ title: 'Download failed', description: 'Please try again while the preview is running.', color: 'error' })
    } finally {
      downloading.value = false
    }
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

  return { preview, navigation, editor, editStep, editError, editRequest, reloadRequest, activity, deployment, deploying, deployError, stopsAt, downloading, deployPanelOpen, serveFrom, navigate, startEditing, deploy, download, clientContext }
}
