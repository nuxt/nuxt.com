import type { UIMessage } from 'ai'
import type { EveMessage } from 'eve/vue'

export function toUIMessages(messages: readonly EveMessage[]): UIMessage[] {
  return [...messages] as UIMessage[]
}

export function normalizeEveParts(parts: UIMessage['parts']): UIMessage['parts'] {
  return parts.filter(part => part.type !== 'step-start')
}

export function hasVisibleParts(parts: UIMessage['parts']): boolean {
  return normalizeEveParts(parts).some((part) => {
    if (part.type === 'text' || part.type === 'reasoning') {
      return 'text' in part && typeof part.text === 'string' && part.text.length > 0
    }
    return part.type.startsWith('tool-') || part.type === 'dynamic-tool'
  })
}
