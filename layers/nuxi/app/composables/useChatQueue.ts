import { ref, toRaw, watch, type Ref } from 'vue'
import type { ChatPromptQueueItem } from '@nuxt/ui'
import type { TextPasteAttachment } from '../../shared/utils/paste-attachment'
import type { AgentChatStatus } from './eve/types'

export type ChatQueueItem = ChatPromptQueueItem & { attachments?: TextPasteAttachment[] }

/**
 * Messages submitted while the chat answers, for `UChatPrompt`'s `v-model:queue`. Each one is sent, in order, once the chat
 * is `ready` again; after an error the queue waits until the visitor retries. "Send now" stops the running answer, so the
 * message it moved to the front goes next.
 *
 * `UChatPrompt` queues the text only, so each message takes the pasted attachments that were in the prompt, and gives
 * them back if the visitor moves it into the prompt to edit it.
 */
export function useChatQueue(options: {
  status: () => AgentChatStatus
  /** Whether a message can be sent at all, e.g. not at the daily limit. */
  canSend: () => boolean
  send: (item: ChatQueueItem) => unknown
  stop: () => void
  input: Ref<string>
  attachments: Ref<TextPasteAttachment[]>
}) {
  const queue = ref<ChatQueueItem[]>([])
  const sent = new WeakSet<ChatQueueItem>()

  watch([queue, options.input], ([next, input], [previous, previousInput]) => {
    for (const item of next) {
      if (previous.includes(item) || item.attachments) continue
      item.attachments = options.attachments.value
      options.attachments.value = []
    }
    for (const item of previous) {
      if (next.includes(item) || sent.has(toRaw(item)) || !item.attachments?.length) continue
      // `UChatPrompt` edits a message by taking it out of the queue and putting its text before the draft, in one go.
      const edited = input === [item.text, previousInput].filter(Boolean).join('\n')
      if (edited) options.attachments.value = [...item.attachments, ...options.attachments.value]
    }
  })

  function sendNext() {
    const [item] = queue.value
    if (!item || options.status() !== 'ready' || !options.canSend()) return
    sent.add(toRaw(item))
    queue.value = queue.value.slice(1)
    options.send(item)
  }

  watch(options.status, sendNext)
  // The daily limit can reset while the chat is idle.
  watch(options.canSend, sendNext)

  /** "Send now" moved the message to the front: end the answer so it goes next. */
  function onSend() {
    if (options.status() === 'ready') sendNext()
    else options.stop()
  }

  return { queue, onSend }
}
