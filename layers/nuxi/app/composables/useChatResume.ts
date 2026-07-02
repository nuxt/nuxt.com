import type { UIMessage } from 'ai'

interface ChatResumeOptions {
  chatId: string
  chat: {
    regenerate: () => Promise<void>
  }
  send: (input: { parts: UIMessage['parts'] }) => Promise<void>
  hasAgentUser: () => boolean
  data: Ref<ChatDetail | undefined>
  loggedIn: Ref<boolean>
  isOwner: Ref<boolean>
  consumePendingPrompt: () => string | null
  consumePendingMessageParts: () => UIMessage['parts'] | null
  onAnonymousTitle?: (parts: UIMessage['parts']) => void
  redirectIfAnonymousEmpty?: () => void
}

function needsGeneration(messages: ChatMessageRow[]) {
  const hasAssistant = messages.some(message => message.role === 'assistant')
  if (hasAssistant) return false
  return messages.some(message => message.role === 'user')
}

export function useChatResume(options: ChatResumeOptions) {
  onMounted(() => {
    if (!options.loggedIn.value) {
      const pendingParts = options.consumePendingMessageParts()
      const pendingPrompt = options.consumePendingPrompt()

      if (!pendingParts && !pendingPrompt) {
        options.redirectIfAnonymousEmpty?.()
        return
      }

      if (pendingParts) {
        options.onAnonymousTitle?.(pendingParts)
        void options.send({ parts: pendingParts })
        return
      }

      if (pendingPrompt) void options.send({ parts: [{ type: 'text', text: pendingPrompt }] })
      return
    }

    const messages = options.data.value?.messages ?? []

    if (options.isOwner.value && needsGeneration(messages)) {
      const lastUserMessage = [...messages].reverse().find(message => message.role === 'user')
      if (!lastUserMessage) return

      // Only regenerate when Eve already holds the user turn (resumed session).
      // Display messages fall back to DB rows, so never use chat.messages here.
      if (options.hasAgentUser()) {
        void options.chat.regenerate()
      } else {
        void options.send({ parts: lastUserMessage.parts as UIMessage['parts'] })
      }
      return
    }

    const pendingParts = options.consumePendingMessageParts()
    if (pendingParts) {
      void options.send({ parts: pendingParts })
      return
    }

    const pendingPrompt = options.consumePendingPrompt()
    if (pendingPrompt) void options.send({ parts: [{ type: 'text', text: pendingPrompt }] })
  })
}
