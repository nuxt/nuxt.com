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

const stepStartPartSchema = z.object({
  type: z.literal('step-start')
})

export const uiMessagePartSchema = z.discriminatedUnion('type', [
  textPartSchema,
  filePartSchema,
  reasoningPartSchema,
  dynamicToolPartSchema,
  stepStartPartSchema
])

export const uiMessagePartsSchema = z.array(uiMessagePartSchema)
