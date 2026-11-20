import { and, eq } from 'drizzle-orm'
import type { LibSQLDatabase } from 'drizzle-orm/libsql'
import { agentMemory } from '../db/schema'

export interface AgentMemoryDocument {
  content: string
  /** Opaque to eve: the row's write counter, as a string. */
  version: string
}

type Database = LibSQLDatabase<Record<string, unknown>>

export async function readAgentMemory(database: Database, key: string): Promise<AgentMemoryDocument | null> {
  const [row] = await database.select({ content: agentMemory.content, version: agentMemory.version })
    .from(agentMemory)
    .where(eq(agentMemory.key, key))
    .limit(1)
  return row ? { content: row.content, version: String(row.version) } : null
}

/**
 * Replaces the document only if it is still at `expectedVersion` (`null`: only if it doesn't
 * exist yet), the contract of eve's `MemoryDocumentBackend`. Returns `null` on a conflict, so
 * the route answers 409 and eve rereads and retries.
 */
export async function writeAgentMemory(database: Database, input: {
  key: string
  content: string
  expectedVersion: string | null
  userId?: string | null
}): Promise<AgentMemoryDocument | null> {
  const updatedAt = new Date()

  if (input.expectedVersion === null) {
    const inserted = await database.insert(agentMemory)
      .values({ key: input.key, content: input.content, version: 1, userId: input.userId ?? null, updatedAt })
      .onConflictDoNothing()
      .returning({ version: agentMemory.version })
    return inserted.length ? { content: input.content, version: '1' } : null
  }

  const expected = Number(input.expectedVersion)
  if (!Number.isSafeInteger(expected)) return null

  const updated = await database.update(agentMemory)
    .set({ content: input.content, version: expected + 1, updatedAt })
    .where(and(eq(agentMemory.key, input.key), eq(agentMemory.version, expected)))
    .returning({ version: agentMemory.version })
  return updated.length ? { content: input.content, version: String(expected + 1) } : null
}
