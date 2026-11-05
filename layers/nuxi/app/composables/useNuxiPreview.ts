import { getToolName, isToolUIPart } from 'ai'
import type { AgentChatHandle } from './eve/types'

const PREVIEW_TOOLS = new Set(['list_app_files', 'read_app_file', 'edit_app_file', 'add_app_module', 'check_app_page'])
const isBusy = (status: string) => status === 'streaming' || status === 'submitted'

export function useNuxiPreview(chat: Pick<AgentChatHandle, 'messages' | 'status'>) {
  const preview = useLivePreview()
  const followed = new Set<string>()
  let followedMessage: string | undefined
  let needsReload = false

  // A restart drops HMR. Reload after the changes are checked, or when the turn ends.
  function reload() {
    if (!needsReload) return
    needsReload = false
    preview.reloadRequest.value++
  }

  const tools = computed(() => preview.preview.value
    ? (chat.messages.at(-1)?.parts ?? []).filter(isToolUIPart).filter(tool =>
        PREVIEW_TOOLS.has(getToolName(tool))
        && (tool.input as { sandboxId?: unknown } | undefined)?.sandboxId === preview.preview.value?.id
      )
    : [])

  // Text and partial arguments cannot affect the preview: only watch tool state transitions.
  watch([
    () => chat.status,
    () => tools.value.map(tool => `${tool.toolCallId}:${tool.state}:${tool.state === 'output-available' && !!tool.preliminary}`).join('|'),
    () => preview.preview.value?.id
  ], ([status, , id], [previousStatus, , previousId]) => {
    if (id !== previousId) {
      followed.clear()
      needsReload = false
    }
    if (!id || (!isBusy(status) && !isBusy(previousStatus))) return
    const messageId = chat.messages.at(-1)?.id
    if (messageId !== followedMessage) {
      followed.clear()
      followedMessage = messageId
    }

    for (const tool of tools.value) {
      preview.startEditing()
      const name = getToolName(tool)
      const input = tool.input as Record<string, unknown>
      const output = tool.state === 'output-available' ? tool.output as Record<string, unknown> | undefined : undefined
      const target = name === 'add_app_module' ? input.name : input.path
      if (name === 'list_app_files' || name === 'read_app_file' || typeof target !== 'string') continue
      const failed = !!output?.error || output?.ok === false || (name === 'check_app_page' && output?.status !== 200)
      const state = tool.state === 'input-available' || (tool.state === 'output-available' && tool.preliminary)
        ? 'running'
        : tool.state === 'output-error' ? 'failed' : tool.state === 'output-available' ? failed ? 'failed' : 'done' : null
      const key = `${tool.toolCallId}:${state}`
      if (!state || followed.has(key)) continue
      followed.add(key)
      const [next, running, done, error] = name === 'add_app_module'
        ? ['install', 'Installing', 'Installed', 'Couldn\'t install']
        : name === 'check_app_page'
          ? ['check', 'Checking', 'Checked', 'Couldn\'t check']
          : input.delete === true ? ['delete', 'Deleting', 'Deleted', 'Couldn\'t delete'] : ['edit', 'Editing', 'Updated', 'Couldn\'t edit']
      preview.activity.value = { id: tool.toolCallId, label: `${{ running, done, failed: error }[state]} ${target}`, next: `${next} ${target}`, state }
      if (state !== 'done') continue
      if (name === 'add_app_module' || output?.restarted === true) needsReload = true
      if (name === 'check_app_page') {
        if (!target.startsWith('/')) reload()
        else if (needsReload) {
          preview.preview.value = { ...preview.preview.value!, path: target }
          reload()
        } else preview.navigate(target)
      }
      preview.preview.value = { ...preview.preview.value!, error: undefined }
      if (typeof input.previewPath === 'string') preview.navigate(input.previewPath)
    }
    if (!isBusy(status)) reload()
  })
}
