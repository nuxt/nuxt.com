import {
  buildClaudeCodeBrowserUrl,
  buildCursorBrowserUrl
} from '~~/layers/nuxi/shared/utils/ide-deeplinks'

/** Opens a prompt in Cursor or Claude Code via browser deeplinks, copying it to the clipboard as a fallback. */
export const useIdeDeeplink = () => {
  const toast = useToast()

  const pasteShortcut = computed(() =>
    typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? '⌘V' : 'Ctrl+V'
  )

  function openDeeplink(url: string) {
    window.open(url, '_self')
  }

  async function copyPromptToClipboard(prompt: string, wasShortened = false) {
    try {
      await navigator.clipboard.writeText(prompt)
      toast.add({
        title: 'Prompt copied',
        description: wasShortened
          ? `The opened prompt was shortened — paste the full prompt with ${pasteShortcut.value} if needed`
          : `Paste with ${pasteShortcut.value} if it doesn't appear automatically`,
        icon: 'i-lucide-clipboard-check'
      })
    } catch {
      // Clipboard can fail without blocking the deeplink handoff.
    }
  }

  function openInCursor(prompt: string) {
    const { url, needsClipboardFallback } = buildCursorBrowserUrl(prompt)
    openDeeplink(url)
    void copyPromptToClipboard(prompt, needsClipboardFallback)
  }

  function openInClaudeCode(prompt: string) {
    const { url, needsClipboardFallback } = buildClaudeCodeBrowserUrl(prompt)
    openDeeplink(url)
    void copyPromptToClipboard(prompt, needsClipboardFallback)
  }

  return {
    pasteShortcut,
    openInCursor,
    openInClaudeCode
  }
}
