import { z } from 'zod'

/** Nuxi's memory backend (`agent/lib/memory.ts`): one document per eve scope key. */
export default defineEventHandler(async (event) => {
  requireInternalRequest(event)
  const { key } = await readValidatedBody(event, z.object({ key: z.string().min(1).max(512) }).parse)
  return { document: await readAgentMemory(db, key) }
})
