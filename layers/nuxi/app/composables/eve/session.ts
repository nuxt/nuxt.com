import type { EveMessageData } from 'eve/vue'
import type { FileUIPart, UIMessage } from 'ai'
import type { MaybeRefOrGetter } from 'vue'
import { computed, toValue } from 'vue'
import type { AgentChatHandle } from './types'
import type { EveAgentBindingOptions } from './init'
import { toUIMessages } from './adapter'
import { getOrCreateEveAgent } from './init'

function lastUserMessage(data: EveMessageData) {
  for (let index = data.messages.length - 1; index >= 0; index -= 1) {
    const message = data.messages[index]
    if (message?.role === 'user' && message.parts.length > 0) {
      return message
    }
  }
}

async function sendUserParts(
  agent: ReturnType<typeof getOrCreateEveAgent>,
  parts: UIMessage['parts']
) {
  const text = parts
    .filter((part): part is { type: 'text', text: string } => part.type === 'text')
    .map(part => part.text)
    .join('\n')
    .trim()

  const fileParts = parts.filter((part): part is FileUIPart => part.type === 'file')

  if (fileParts.length && text) {
    await agent.send({
      message: [
        { type: 'text', text },
        ...fileParts.map(part => ({
          type: 'file' as const,
          data: part.url,
          mediaType: part.mediaType,
          filename: part.filename
        }))
      ]
    })
    return
  }

  if (fileParts.length) {
    await agent.send({
      message: fileParts.map(part => ({
        type: 'file' as const,
        data: part.url,
        mediaType: part.mediaType,
        filename: part.filename
      }))
    })
    return
  }

  if (text) {
    await agent.send({ message: text })
  }
}

export function createEveChatSession(
  chatId: MaybeRefOrGetter<string>,
  options?: MaybeRefOrGetter<EveAgentBindingOptions | undefined>
): AgentChatHandle & {
  send: (input: string | { parts: UIMessage['parts'] }) => Promise<void>
} {
  const id = computed(() => toValue(chatId))
  const resolvedOptions = computed(() => toValue(options))
  const agent = computed(() => getOrCreateEveAgent(id.value, resolvedOptions.value))

  const messages = computed(() => toUIMessages(agent.value.data.value.messages))
  const status = computed(() => agent.value.status.value)
  const error = computed(() => agent.value.error.value)

  async function send(input: string | { parts: UIMessage['parts'] }) {
    const parts = typeof input === 'string'
      ? [{ type: 'text' as const, text: input }]
      : input.parts

    await sendUserParts(agent.value, parts)
  }

  function stop() {
    agent.value.stop()
  }

  async function regenerate() {
    if (status.value === 'submitted' || status.value === 'streaming') return
    const message = lastUserMessage(agent.value.data.value)
    if (!message) return
    await sendUserParts(agent.value, message.parts as UIMessage['parts'])
  }

  return {
    get messages() {
      return messages.value
    },
    get status() {
      return status.value
    },
    get error() {
      return error.value
    },
    send,
    stop,
    regenerate
  }
}
