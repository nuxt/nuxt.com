import { ref, toRaw, watch, type Ref } from 'vue'
import type { ChatPromptQueueItem } from '@nuxt/ui'
import type { TextPasteAttachment } from '../../shared/utils/paste-attachment'
import type { AgentChatStatus } from './eve/types'

export type ChatQueueItem = ChatPromptQueueItem & { attachments?: TextPasteAttachment[] }

/**
 * Messages submitted while the chat answers, for `UChatPrompt`'s `v-model:queue`. The first one is sent once the chat is
 * `ready` again; after an error the queue waits until the visitor retries. "Send now" stops the answer, which sends it.
 *
 * `UChatPrompt` queues the text only, so each message takes the pasted attachments that were in the prompt, and gives
 * them back if the visitor moves it into the prompt to edit it.
 */
export function useChatQueue(options: {
  status: () => AgentChatStatus
  /** Whether a message can be sent at all, e.g. not at the daily limit. */
  canSend: () => boolean
  send: (item: ChatQueueItem) => void
  stop: () => void
  input: Ref<string>
  attachments: Ref<TextPasteAttachment[]>
}) {
  const queue = ref<ChatQueueItem[]>([])
  const sent = new WeakSet<ChatQueueItem>()
  const isBusy = () => options.status() === 'submitted' || options.status() === 'streaming'

  watch(queue, (next, previous) => {
    for (const item of next) {
      if (previous.includes(item) || item.attachments) continue
      item.attachments = options.attachments.value
      options.attachments.value = []
    }
    for (const item of previous) {
      if (next.includes(item) || sent.has(toRaw(item)) || !item.attachments?.length) continue
      // Moved into the prompt to edit it: the prompt now holds its text.
      if (options.input.value.includes(item.text)) options.attachments.value = [...item.attachments, ...options.attachments.value]
    }
  })

  function sendNext() {
    const [item, ...rest] = queue.value
    if (!item || isBusy() || options.status() === 'error' || !options.canSend()) return
    sent.add(toRaw(item))
    queue.value = rest
    options.send(item)
  }

  watch(options.status, status => status === 'ready' && sendNext())

  /** "Send now" moved the message to the front. */
  function onSend() {
    if (isBusy()) options.stop()
    else sendNext()
  }

  return { queue, onSend }
}
