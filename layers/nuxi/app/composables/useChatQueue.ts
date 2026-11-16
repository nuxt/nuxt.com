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
  /** May save the message before the chat starts answering; nothing else is sent until it settles. */
  send: (item: ChatQueueItem) => void | Promise<void>
  stop: () => void
  input: Ref<string>
  attachments: Ref<TextPasteAttachment[]>
}) {
  const queue = ref<ChatQueueItem[]>([])
  const sent = new WeakSet<ChatQueueItem>()
  let sending = false
  /** The answer ended while its message was still being sent, so the next one waits for that send to settle. */
  let readyWhileSending = false
  const isAnswering = () => options.status() === 'submitted' || options.status() === 'streaming'

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
    const [item, ...rest] = queue.value
    if (!item || sending || isAnswering() || options.status() === 'error' || !options.canSend()) return
    sent.add(toRaw(item))
    queue.value = rest
    sending = true
    void Promise.resolve(options.send(item)).finally(() => {
      sending = false
      if (readyWhileSending) sendNext()
      readyWhileSending = false
    })
  }

  watch(options.status, (status) => {
    if (status !== 'ready') return
    if (sending) readyWhileSending = true
    else sendNext()
  })

  /** "Send now" moved the message to the front. */
  function onSend() {
    // The message being sent goes first anyway; the picked one is next.
    if (sending) return
    if (isAnswering()) options.stop()
    else sendNext()
  }

  return { queue, onSend }
}
