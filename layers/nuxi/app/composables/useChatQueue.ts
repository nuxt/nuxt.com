import { ref, toRaw, watch, type Ref } from 'vue'
import type { ChatPromptQueueItem } from '@nuxt/ui'
import type { TextPasteAttachment } from '../../shared/utils/paste-attachment'
import type { AgentChatStatus } from './eve/types'

export type ChatQueueItem = ChatPromptQueueItem & { attachments?: TextPasteAttachment[] }

/**
 * Messages submitted while the chat answers, for `UChatPrompt`'s `v-model:queue`. The first one is sent once the chat is
 * `ready` again; after an error the queue waits until the visitor retries. "Send now" sends right away: during an answer,
 * Eve steers the running turn with it instead of starting another.
 *
 * `UChatPrompt` queues the text only, so each message takes the pasted attachments that were in the prompt, and gives
 * them back if the visitor moves it into the prompt to edit it.
 */
export function useChatQueue(options: {
  status: () => AgentChatStatus
  /** Whether a message can be sent at all, e.g. not at the daily limit. */
  canSend: () => boolean
  /** May save the message before the chat gets it; sends run one at a time, in order. */
  send: (item: ChatQueueItem) => void | Promise<void>
  input: Ref<string>
  attachments: Ref<TextPasteAttachment[]>
}) {
  const queue = ref<ChatQueueItem[]>([])
  const sent = new WeakSet<ChatQueueItem>()
  let pending = 0
  let sends: Promise<unknown> = Promise.resolve()
  /** The answer ended while messages were still being sent, so the next one goes once they settle. */
  let readyWhileSending = false

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

  const canDispatch = () => options.status() !== 'error' && options.canSend()

  function dispatch(item: ChatQueueItem) {
    sent.add(toRaw(item))
    queue.value = queue.value.filter(other => other !== item)
    pending++
    // Failures surface through the chat's own error state, which holds the queue.
    sends = sends.then(() => options.send(item)).catch(() => {}).finally(() => {
      if (--pending > 0 || !readyWhileSending) return
      readyWhileSending = false
      sendNext()
    })
  }

  function sendNext() {
    const [item] = queue.value
    const answering = options.status() === 'submitted' || options.status() === 'streaming'
    if (item && !answering && canDispatch()) dispatch(item)
  }

  watch(options.status, (status) => {
    if (status !== 'ready') return
    if (pending) readyWhileSending = true
    else sendNext()
  })

  /** "Send now" moved the message to the front. */
  function onSend() {
    const [item] = queue.value
    if (item && canDispatch()) dispatch(item)
  }

  return { queue, onSend }
}
