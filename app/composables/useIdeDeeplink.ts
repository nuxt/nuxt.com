import {
  buildClaudeCodeBrowserUrl,
  buildCursorBrowserUrl
} from '~~/layers/nuxi/shared/utils/ide-deeplinks'

/** Opens a prompt in Cursor or Claude Code via browser deeplinks. */
export const useIdeDeeplink = () => {
  const toast = useToast()

  const pasteShortcut = computed(() =>
    typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘V' : 'Ctrl+V'
  )

  function openDeeplink(url: string) {
    window.open(url, '_self')
  }

  /** Only needed when the URL had to be shortened to fit the browser length limit — the opened prompt is incomplete. */
  async function copyShortenedPromptToClipboard(prompt: string) {
    try {
      await navigator.clipboard.writeText(prompt)
      toast.add({
        title: 'Prompt copied',
        description: `The opened prompt was shortened — paste the full prompt with ${pasteShortcut.value} if needed`,
        icon: 'i-lucide-clipboard-check'
      })
    } catch {
      // Clipboard can fail without blocking the deeplink handoff.
    }
  }

  function openInCursor(prompt: string) {
    const { url, needsClipboardFallback } = buildCursorBrowserUrl(prompt)
    openDeeplink(url)
    if (needsClipboardFallback) void copyShortenedPromptToClipboard(prompt)
  }

  function openInClaudeCode(prompt: string) {
    const { url, needsClipboardFallback } = buildClaudeCodeBrowserUrl(prompt)
    openDeeplink(url)
    if (needsClipboardFallback) void copyShortenedPromptToClipboard(prompt)
  }

  return {
    pasteShortcut,
    openInCursor,
    openInClaudeCode
  }
}
