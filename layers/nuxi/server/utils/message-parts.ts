import { z } from 'zod'

const textPartSchema = z.object({
  type: z.literal('text'),
  text: z.string()
})

const filePartSchema = z.object({
  type: z.literal('file'),
  url: z.string(),
  mediaType: z.string().default('application/octet-stream'),
  filename: z.string().optional()
})

const reasoningPartSchema = z.object({
  type: z.literal('reasoning'),
  text: z.string()
}).loose()

const dynamicToolPartSchema = z.object({
  type: z.literal('dynamic-tool'),
  toolCallId: z.string(),
  toolName: z.string()
}).loose()

const toolPartSchema = z.object({
  type: z.string().regex(/^tool-/)
}).loose()

const httpUrlSchema = z.string().refine((value) => {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}, { message: 'Expected an http(s) URL' })

const sourceUrlPartSchema = z.object({
  type: z.literal('source-url'),
  url: httpUrlSchema
}).loose()

const sourceDocumentPartSchema = z.object({
  type: z.literal('source-document')
}).loose()

const stepStartPartSchema = z.object({
  type: z.literal('step-start')
})

export const uiMessagePartSchema = z.union([
  textPartSchema,
  filePartSchema,
  reasoningPartSchema,
  dynamicToolPartSchema,
  toolPartSchema,
  sourceUrlPartSchema,
  sourceDocumentPartSchema,
  stepStartPartSchema
])

export const uiMessagePartsSchema = z.array(uiMessagePartSchema)
