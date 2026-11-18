import type { UIMessage } from 'ai'
import { isTextUIPart } from 'ai'

export function stripFollowUpSuggestions(text: string): string {
  return text.replace(/(?:^|\n)\s*:follow-ups\{(?:[^}"'\\]|\\[\s\S]|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*')*\}\s*$/u, '').trimEnd()
}

export function getMergedParts(parts: UIMessage['parts']): UIMessage['parts'] {
  const result: UIMessage['parts'] = []
  for (const part of parts) {
    const prev = result[result.length - 1]
    if (part.type === 'source-url') {
      if (prev && isTextUIPart(prev)) {
        result[result.length - 1] = { ...prev, text: prev.text + sourceToInlineMdc(part.url) }
      }
      continue
    }
    if (isTextUIPart(part) && prev && isTextUIPart(prev)) {
      result[result.length - 1] = { ...part, ...('id' in prev && { id: prev.id }), text: prev.text + part.text }
    } else {
      result.push(part)
    }
  }
  return result
}
