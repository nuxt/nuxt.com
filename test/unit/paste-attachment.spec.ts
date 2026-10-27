import type { UIMessage } from 'ai'
import { describe, expect, it } from 'vitest'
import {
  attachmentToFilePart,
  attachmentToText,
  expandAttachmentParts,
  getFilePartContent,
  guessExtension,
  toEveUserContent
} from '../../layers/nuxi/shared/utils/paste-attachment'
import { titleFromParts } from '../../layers/nuxi/shared/utils/chat'

const stackTrace = [
  'TypeError: Cannot read properties of undefined (reading \'value\')',
  '    at setup (app.vue:12:5)',
  '    at callWithErrorHandling (runtime-core.esm-bundler.js:199:19)'
].join('\n')

describe('guessExtension', () => {
  it('treats stack traces as plain text, not YAML', () => {
    expect(guessExtension(stackTrace)).toBe('.txt')
    expect(guessExtension('Error: listen EADDRINUSE: address already in use :::3000')).toBe('.txt')
  })

  it('still detects YAML', () => {
    expect(guessExtension('name: nuxt\nversion: 4.2.0')).toBe('.yaml')
  })
})

describe('toEveUserContent', () => {
  it('inlines text attachments so the model reads them without opening a file', () => {
    const content = toEveUserContent([
      attachmentToFilePart({ name: 'snippet.txt', content: stackTrace }),
      { type: 'text', text: 'Why does this crash?' }
    ])

    expect(content).toEqual([
      { type: 'text', text: attachmentToText({ name: 'snippet.txt', content: stackTrace }) },
      { type: 'text', text: 'Why does this crash?' }
    ])
    expect(JSON.stringify(content)).toContain('at setup (app.vue:12:5)')
  })

  it('inlines JSON attachments', () => {
    const content = toEveUserContent([attachmentToFilePart({ name: 'snippet.json', content: '{"a":1}' })])
    expect(content).toBe(attachmentToText({ name: 'snippet.json', content: '{"a":1}' }))
  })

  it('keeps binary files as file parts', () => {
    const image = { type: 'file' as const, mediaType: 'image/png', filename: 'shot.png', url: 'data:image/png;base64,iVBORw0KGgo=' }
    expect(toEveUserContent([image])).toEqual([
      { type: 'file', data: image.url, mediaType: 'image/png', filename: 'shot.png' }
    ])
  })

  it('sends plain text as a string and skips empty input', () => {
    expect(toEveUserContent([{ type: 'text', text: '  hello  ' }])).toBe('hello')
    expect(toEveUserContent([{ type: 'text', text: '   ' }])).toBeNull()
  })
})

describe('titleFromParts', () => {
  it('falls back to the attachment name when the message has no text', () => {
    expect(titleFromParts([attachmentToFilePart({ name: 'snippet.ts', content: 'const a = 1' })])).toBe('snippet.ts')
    expect(titleFromParts([])).toBe('Untitled')
  })
})

describe('expandAttachmentParts', () => {
  it('restores the file chip from an inlined attachment', () => {
    const parts: UIMessage['parts'] = [
      { type: 'text', text: attachmentToText({ name: 'snippet.ts', content: 'const a = 1\n' }) },
      { type: 'text', text: 'Explain this' }
    ]

    const expanded = expandAttachmentParts(parts)
    expect(expanded).toHaveLength(2)
    expect(expanded[0]).toMatchObject({ type: 'file', filename: 'snippet.ts', mediaType: 'text/plain' })
    expect(getFilePartContent(expanded[0] as never)).toBe('const a = 1\n')
    expect(expanded[1]).toEqual({ type: 'text', text: 'Explain this' })
  })

  it('splits the optimistic message, where Eve joins every text part', () => {
    const joined = [
      attachmentToText({ name: 'snippet.txt', content: stackTrace }),
      attachmentToText({ name: 'snippet-2.txt', content: 'second' }),
      'What is wrong?'
    ].join('\n')

    const expanded = expandAttachmentParts([{ type: 'text', text: joined }])
    expect(expanded.map(part => part.type)).toEqual(['file', 'file', 'text'])
    expect(getFilePartContent(expanded[0] as never)).toBe(stackTrace)
    expect(getFilePartContent(expanded[1] as never)).toBe('second')
  })

  it('round-trips content that contains code fences', () => {
    const markdown = '# Title\n\n````ts\nconst a = 1\n````\n\n```\nplain\n```'
    const [part] = expandAttachmentParts([{ type: 'text', text: attachmentToText({ name: 'notes.md', content: markdown }) }])
    expect(getFilePartContent(part as never)).toBe(markdown)
  })

  it('leaves regular text untouched', () => {
    const parts: UIMessage['parts'] = [{ type: 'text', text: '```ts\nconst a = 1\n```' }]
    expect(expandAttachmentParts(parts)).toBe(parts)
  })
})
