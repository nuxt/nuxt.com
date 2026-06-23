import type { usePasteAttachment } from './usePasteAttachment'

export function createPromptBindings(
  paste: ReturnType<typeof usePasteAttachment>,
  onSubmit: () => void | Promise<void>
) {
  return computed(() => ({
    pasteAttachments: paste.attachments.value,
    canSubmit: paste.canSubmit.value,
    onPaste: paste.handlePaste,
    onRemoveAttachment: paste.removeAttachment,
    onRestoreAttachment: paste.restoreToInput,
    onSubmit
  }))
}
