import type { FileUIPart, UIMessage, UserContent } from 'ai'

export const PASTE_ATTACHMENT_MIN_CHARS = 400
export const PASTE_ATTACHMENT_MIN_LINES = 8

export interface TextPasteAttachment {
  content: string
  name: string
}

const EXTENSION_META = {
  '.vue': { label: 'Vue', mediaType: 'text/plain', language: 'vue', icon: 'i-vscode-icons-file-type-vue' },
  '.tsx': { label: 'TSX', mediaType: 'text/plain', language: 'tsx', icon: 'i-vscode-icons-file-type-reactts' },
  '.jsx': { label: 'JSX', mediaType: 'text/plain', language: 'jsx', icon: 'i-vscode-icons-file-type-reactjs' },
  '.mts': { label: 'TypeScript', mediaType: 'text/plain', language: 'typescript', icon: 'i-vscode-icons-file-type-typescript' },
  '.cts': { label: 'TypeScript', mediaType: 'text/plain', language: 'typescript', icon: 'i-vscode-icons-file-type-typescript' },
  '.ts': { label: 'TypeScript', mediaType: 'text/plain', language: 'typescript', icon: 'i-vscode-icons-file-type-typescript' },
  '.mjs': { label: 'JavaScript', mediaType: 'text/plain', language: 'javascript', icon: 'i-vscode-icons-file-type-js' },
  '.cjs': { label: 'JavaScript', mediaType: 'text/plain', language: 'javascript', icon: 'i-vscode-icons-file-type-js' },
  '.js': { label: 'JavaScript', mediaType: 'text/plain', language: 'javascript', icon: 'i-vscode-icons-file-type-js' },
  '.json': { label: 'JSON', mediaType: 'application/json', language: 'json', icon: 'i-vscode-icons-file-type-json' },
  '.yaml': { label: 'YAML', mediaType: 'text/yaml', language: 'yaml', icon: 'i-vscode-icons-file-type-yaml' },
  '.yml': { label: 'YAML', mediaType: 'text/yaml', language: 'yaml', icon: 'i-vscode-icons-file-type-yaml' },
  '.mdc': { label: 'Markdown', mediaType: 'text/markdown', language: 'markdown', icon: 'i-vscode-icons-file-type-markdown' },
  '.md': { label: 'Markdown', mediaType: 'text/markdown', language: 'markdown', icon: 'i-vscode-icons-file-type-markdown' },
  '.scss': { label: 'SCSS', mediaType: 'text/plain', language: 'scss', icon: 'i-vscode-icons-file-type-scss' },
  '.css': { label: 'CSS', mediaType: 'text/plain', language: 'css', icon: 'i-vscode-icons-file-type-css' },
  '.html': { label: 'HTML', mediaType: 'text/html', language: 'html', icon: 'i-vscode-icons-file-type-html' },
  '.env': { label: 'Env', mediaType: 'text/plain', language: 'shell', icon: 'i-vscode-icons-file-type-dotenv' }
} as const

const DEFAULT_EXTENSION_META = {
  label: 'Text',
  mediaType: 'text/plain',
  language: 'text',
  icon: 'i-vscode-icons-file-type-text'
} as const

const EXTENSIONS_BY_LENGTH = Object.keys(EXTENSION_META).sort((a, b) => b.length - a.length)

export function getExtensionMeta(filename: string) {
  const ext = EXTENSIONS_BY_LENGTH.find(extension => filename.endsWith(extension))
  return ext ? EXTENSION_META[ext as keyof typeof EXTENSION_META] : DEFAULT_EXTENSION_META
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

export function guessExtension(content: string): string {
  const trimmed = content.trimStart()
  const lines = firstNonEmptyLines(content)
  const first = lines[0] ?? ''

  if (/^\w*(?:Error|Exception)\b/.test(first) || lines.some(line => /^at\s+\S/.test(line))) {
    return '.txt'
  }

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
    } catch {
      // Not valid JSON — fall through to other heuristics
    }
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
  const { mediaType } = getExtensionMeta(attachment.name)
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

  const { language } = getExtensionMeta(filename)
  return `\`\`\`${language}\n${content}\n\`\`\``
}

export function filePartToAttachment(part: FileUIPart): TextPasteAttachment {
  return {
    name: part.filename ?? 'snippet.txt',
    content: getFilePartContent(part) ?? ''
  }
}

/**
 * Eve stages file parts in the sandbox and only hands the model a path, which
 * Nuxi can't open — text attachments travel inline as tagged blocks instead.
 */
const ATTACHMENT_BLOCK = /<attachment filename="([^"\n]+)">\n(`{3,})[^`\n]*\n([\s\S]*?)\n\2\n<\/attachment>/g

export function attachmentToText({ name, content }: TextPasteAttachment): string {
  const runs: string[] = content.match(/`+/g) ?? []
  const longestRun = runs.reduce((max, run) => Math.max(max, run.length), 2)
  const fence = '`'.repeat(longestRun + 1)
  const { language } = getExtensionMeta(name)
  return `<attachment filename="${name.replaceAll('"', '')}">\n${fence}${language}\n${content}\n${fence}\n</attachment>`
}

export function isTextFilePart(part: FileUIPart): boolean {
  return (part.mediaType.startsWith('text/') || part.mediaType === 'application/json')
    && getFilePartContent(part) !== null
}

/** Turns UI parts into Eve user content, inlining text attachments. */
export function toEveUserContent(parts: UIMessage['parts']): string | UserContent | null {
  const content: Exclude<UserContent, string> = []

  for (const part of parts) {
    if (part.type === 'text') {
      const text = part.text.trim()
      if (text) content.push({ type: 'text', text })
    } else if (part.type === 'file') {
      content.push(isTextFilePart(part)
        ? { type: 'text', text: attachmentToText(filePartToAttachment(part)) }
        : { type: 'file', data: part.url, mediaType: part.mediaType, filename: part.filename })
    }
  }

  if (!content.length) return null
  const [first] = content
  return content.length === 1 && first?.type === 'text' ? first.text : content
}

/** Restores the file chips for attachment blocks found in user text parts. */
export function expandAttachmentParts(parts: UIMessage['parts']): UIMessage['parts'] {
  if (!parts.some(part => part.type === 'text' && part.text.includes('<attachment '))) return parts

  return parts.flatMap((part) => {
    if (part.type !== 'text') return [part]

    const expanded: UIMessage['parts'] = []
    let cursor = 0
    for (const match of part.text.matchAll(ATTACHMENT_BLOCK)) {
      const before = part.text.slice(cursor, match.index).trim()
      if (before) expanded.push({ ...part, text: before })
      expanded.push(attachmentToFilePart({ name: match[1]!, content: match[3]! }))
      cursor = match.index + match[0].length
    }
    if (!cursor) return [part]

    const after = part.text.slice(cursor).trim()
    if (after) expanded.push({ ...part, text: after })
    return expanded
  })
}

export function getMessageTextLength(parts: UIMessage['parts']): number {
  return parts.reduce((total, part) => {
    if (part.type === 'text') return total + part.text.length
    if (part.type === 'file') return total + (getFilePartContent(part)?.length ?? 0)
    return total
  }, 0)
}
