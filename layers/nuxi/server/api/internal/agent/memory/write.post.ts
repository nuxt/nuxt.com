import { z } from 'zod'

const MAX_DOCUMENT_BYTES = 65_536

/** Nuxi's memory backend (`agent/lib/memory.ts`): a conditional replace, 409 when the version moved. */
export default defineEventHandler(async (event) => {
  requireInternalRequest(event)
  const input = await readValidatedBody(event, z.object({
    key: z.string().min(1).max(512),
    content: z.string().refine(value => Buffer.byteLength(value) <= MAX_DOCUMENT_BYTES, 'Document too large'),
    expectedVersion: z.string().min(1).nullable(),
    userId: z.string().min(1).nullable().optional()
  }).parse)

  const document = await writeAgentMemory(db, { ...input, expectedVersion: input.expectedVersion ?? null })
  if (!document) {
    throw createError({ statusCode: 409, statusMessage: 'Memory document changed' })
  }
  return { document }
})
