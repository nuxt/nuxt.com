import type { UIMessage } from 'ai'
import {
  buildMessageParts,
  guessAttachmentName,
  shouldConvertPasteToAttachment,
  type TextPasteAttachment
} from '../../shared/utils/paste-attachment'

export function usePasteAttachment(input: Ref<string>) {
  const attachments = ref<TextPasteAttachment[]>([])

  const canSubmit = computed(() =>
    Boolean(input.value.trim() || attachments.value.length)
  )

  function handlePaste(event: ClipboardEvent) {
    const text = event.clipboardData?.getData('text/plain')
    if (!text || !shouldConvertPasteToAttachment(text)) return

    event.preventDefault()
    attachments.value.push({
      content: text,
      name: guessAttachmentName(text, attachments.value.map(attachment => attachment.name))
    })
  }

  function removeAttachment(index: number) {
    attachments.value.splice(index, 1)
  }

  function restoreToInput(index: number) {
    const attachment = attachments.value[index]
    if (!attachment) return

    const content = attachment.content
    input.value = input.value.trim()
      ? `${content}\n\n${input.value.trim()}`
      : content
    attachments.value.splice(index, 1)
  }

  function clearAttachments() {
    attachments.value = []
  }

  function bindings(onSubmit: () => void | Promise<void>) {
    return computed(() => ({
      pasteAttachments: attachments.value,
      canSubmit: canSubmit.value,
      onPaste: handlePaste,
      onRemoveAttachment: removeAttachment,
      onRestoreAttachment: restoreToInput,
      onSubmit
    }))
  }

  return {
    attachments,
    canSubmit,
    handlePaste,
    removeAttachment,
    restoreToInput,
    buildMessageParts: (): UIMessage['parts'] => buildMessageParts(input.value, attachments.value),
    clearAttachments,
    bindings
  }
}
