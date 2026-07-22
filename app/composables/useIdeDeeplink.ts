import {
  buildClaudeCodeBrowserUrl,
  buildCursorBrowserUrl
} from '~~/layers/nuxi/shared/utils/ide-deeplinks'

/**
 * Opens a prompt in Cursor or Claude Code via browser deeplinks.
 *
 * Both Cursor and Claude Desktop have known, unresolved bugs in their deeplink
 * URL parsers that can reject an otherwise-valid, correctly-encoded prompt
 * (e.g. Cursor's "Invalid text for prompt" — see
 * https://forum.cursor.com/t/error-handling-deep-link-invalid-text-for-prompt/149270).
 * Since the webpage has no way to detect that failure, the prompt is always
 * copied to the clipboard first as a safety net, regardless of URL length.
 */
export const useIdeDeeplink = () => {
  const toast = useToast()

  const pasteShortcut = computed(() =>
    typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘V' : 'Ctrl+V'
  )

  function openDeeplink(url: string) {
    window.location.assign(url)
  }

  async function copyPromptToClipboard(prompt: string) {
    try {
      await navigator.clipboard.writeText(prompt)
      toast.add({
        title: 'Prompt copied',
        description: `Paste with ${pasteShortcut.value} if it doesn't appear automatically`,
        icon: 'i-lucide-clipboard-check'
      })
    } catch {
      // Clipboard can fail without blocking the deeplink handoff.
    }
  }

  async function openInCursor(prompt: string) {
    const { url } = buildCursorBrowserUrl(prompt)
    await copyPromptToClipboard(prompt)
    openDeeplink(url)
  }

  async function openInClaudeCode(prompt: string) {
    const { url } = buildClaudeCodeBrowserUrl(prompt)
    await copyPromptToClipboard(prompt)
    openDeeplink(url)
  }

  return {
    pasteShortcut,
    openInCursor,
    openInClaudeCode
  }
}
