import type { FileUIPart, UIMessage } from 'ai'

export const PASTE_ATTACHMENT_MIN_CHARS = 400
export const PASTE_ATTACHMENT_MIN_LINES = 8

export interface TextPasteAttachment {
  content: string
  name: string
}

export function shouldConvertPasteToAttachment(text: string): boolean {
  return text.length >= PASTE_ATTACHMENT_MIN_CHARS
    || text.split('\n').length >= PASTE_ATTACHMENT_MIN_LINES
}

function firstNonEmptyLines(content: string, count = 5): string[] {
  return content
    .trimStart()
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .slice(0, count)
}

function guessExtension(content: string): string {
  const trimmed = content.trimStart()
  const lines = firstNonEmptyLines(content)
  const first = lines[0] ?? ''

  if (/^<(?:template|script|style)\b/.test(first) || lines.some(line => /^<(?:template|script|style)\b/.test(line))) {
    return '.vue'
  }

  if (/^(?:import|export|const|function|interface|type|enum|declare)\b/.test(first)) {
    return '.ts'
  }

  if (/^(?:const|let|var|function|require\(|module\.exports)\b/.test(first)) {
    return '.js'
  }

  if (/\bdefineNuxtConfig\s*\(/.test(content)) {
    return '.ts'
  }

  if (/^[[{]/.test(trimmed)) {
    try {
      JSON.parse(trimmed)
      return '.json'
    } catch {}
  }

  if (/^<!DOCTYPE\s+html/i.test(first) || /^<html[\s>]/i.test(first)) {
    return '.html'
  }

  if (/^@(?:tailwind|apply|layer|import|use)\b/.test(first) || /^[.#][\w-]+\s*\{/.test(first)) {
    return trimmed.includes('$') || lines.some(line => /^@mixin\b/.test(line)) ? '.scss' : '.css'
  }

  if (
    lines.some(line => /^[\w.-]+:\s+\S/.test(line))
    && !/^(?:import|export|const|function|interface|type)\b/.test(first)
  ) {
    return '.yaml'
  }

  if (lines.some(line => /^(?:#+\s|[-*]\s|::[\w-]|```|---\s*$)/.test(line))) {
    return '.md'
  }

  if (/^(?:export\s+)?[A-Z][A-Z0-9_]*=/.test(first)) {
    return '.env'
  }

  return '.txt'
}

export function guessAttachmentName(content: string, existingNames: string[] = []): string {
  const ext = guessExtension(content)
  const base = `snippet${ext}`

  if (!existingNames.includes(base)) {
    return base
  }

  let index = 2
  while (existingNames.includes(`snippet-${index}${ext}`)) {
    index++
  }

  return `snippet-${index}${ext}`
}

export function attachmentTypeLabel(filename: string): string {
  if (filename.endsWith('.vue')) return 'Vue'
  if (filename.endsWith('.tsx')) return 'TSX'
  if (filename.endsWith('.ts') || filename.endsWith('.mts')) return 'TypeScript'
  if (filename.endsWith('.jsx')) return 'JSX'
  if (filename.endsWith('.js') || filename.endsWith('.mjs')) return 'JavaScript'
  if (filename.endsWith('.json')) return 'JSON'
  if (filename.endsWith('.yaml') || filename.endsWith('.yml')) return 'YAML'
  if (filename.endsWith('.md') || filename.endsWith('.mdc')) return 'Markdown'
  if (filename.endsWith('.css') || filename.endsWith('.scss')) return 'CSS'
  if (filename.endsWith('.html')) return 'HTML'
  if (filename.endsWith('.env')) return 'Env'
  return 'Text'
}

export function guessMediaType(filename: string): string {
  if (filename.endsWith('.json')) return 'application/json'
  if (filename.endsWith('.md') || filename.endsWith('.mdc')) return 'text/markdown'
  if (filename.endsWith('.html')) return 'text/html'
  if (filename.endsWith('.yaml') || filename.endsWith('.yml')) return 'text/yaml'
  return 'text/plain'
}

export function encodeTextToDataUrl(content: string, mediaType: string): string {
  const base64 = typeof btoa !== 'undefined'
    ? btoa(unescape(encodeURIComponent(content)))
    : Buffer.from(content, 'utf-8').toString('base64')

  return `data:${mediaType};base64,${base64}`
}

export function decodeTextFromDataUrl(url: string): string | null {
  if (!url.startsWith('data:')) return null

  const commaIndex = url.indexOf(',')
  if (commaIndex === -1) return null

  const header = url.slice(5, commaIndex)
  const data = url.slice(commaIndex + 1)

  try {
    if (header.includes(';base64')) {
      if (typeof atob !== 'undefined') {
        return decodeURIComponent(escape(atob(data)))
      }
      return Buffer.from(data, 'base64').toString('utf-8')
    }
    return decodeURIComponent(data)
  } catch {
    return null
  }
}

export function attachmentToFilePart(attachment: TextPasteAttachment): FileUIPart {
  const mediaType = guessMediaType(attachment.name)
  return {
    type: 'file',
    mediaType,
    filename: attachment.name,
    url: encodeTextToDataUrl(attachment.content, mediaType)
  }
}

export function buildMessageParts(text: string, attachments: TextPasteAttachment[]): UIMessage['parts'] {
  const parts: UIMessage['parts'] = attachments.map(attachmentToFilePart)

  const trimmed = text.trim()
  if (trimmed) {
    parts.push({ type: 'text', text: trimmed })
  }

  return parts
}

export function getFilePartContent(part: FileUIPart): string | null {
  return decodeTextFromDataUrl(part.url)
}

export function isRenderableMarkdown(filename: string): boolean {
  return filename.endsWith('.md') || filename.endsWith('.mdc')
}

export function attachmentToComark(content: string, filename: string): string {
  if (isRenderableMarkdown(filename)) {
    return content
  }

  return `\`\`\`${guessHighlightLanguage(filename)}\n${content}\n\`\`\``
}

export function guessHighlightLanguage(filename: string): string {
  if (filename.endsWith('.vue')) return 'vue'
  if (filename.endsWith('.tsx')) return 'tsx'
  if (filename.endsWith('.ts') || filename.endsWith('.mts') || filename.endsWith('.cts')) return 'typescript'
  if (filename.endsWith('.jsx')) return 'jsx'
  if (filename.endsWith('.js') || filename.endsWith('.mjs') || filename.endsWith('.cjs')) return 'javascript'
  if (filename.endsWith('.json')) return 'json'
  if (filename.endsWith('.yaml') || filename.endsWith('.yml')) return 'yaml'
  if (filename.endsWith('.md') || filename.endsWith('.mdc')) return 'markdown'
  if (filename.endsWith('.css')) return 'css'
  if (filename.endsWith('.scss')) return 'scss'
  if (filename.endsWith('.html')) return 'html'
  if (filename.endsWith('.env')) return 'shell'
  return 'text'
}

export function guessAttachmentIcon(filename: string): string {
  if (filename.endsWith('.vue')) return 'i-logos-vue'
  if (filename.endsWith('.ts') || filename.endsWith('.tsx') || filename.endsWith('.mts')) return 'i-logos-typescript-icon'
  if (filename.endsWith('.js') || filename.endsWith('.jsx') || filename.endsWith('.mjs')) return 'i-logos-javascript'
  if (filename.endsWith('.json')) return 'i-lucide-braces'
  if (filename.endsWith('.md') || filename.endsWith('.mdc')) return 'i-lucide-file-text'
  if (filename.endsWith('.yaml') || filename.endsWith('.yml')) return 'i-lucide-file-code'
  if (filename.endsWith('.css') || filename.endsWith('.scss')) return 'i-lucide-palette'
  if (filename.endsWith('.html')) return 'i-lucide-file-code'
  return 'i-lucide-file-text'
}

export function filePartToAttachment(part: FileUIPart): TextPasteAttachment {
  return {
    name: part.filename ?? 'snippet.txt',
    content: getFilePartContent(part) ?? ''
  }
}

export function attachmentPreview(content: string, maxLength = 64): string {
  const line = content.trimStart().split('\n')[0]?.trim() ?? ''
  if (line.length <= maxLength) return line
  return `${line.slice(0, maxLength)}…`
}

export function getMessageTextLength(parts: UIMessage['parts']): number {
  return parts.reduce((total, part) => {
    if (part.type === 'text') return total + part.text.length
    if (part.type === 'file') return total + (getFilePartContent(part)?.length ?? 0)
    return total
  }, 0)
}
