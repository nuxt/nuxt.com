import { inArray } from 'drizzle-orm'

/** Matches chats their owner has shared with admins or made public. */
export function adminReadableChat() {
  return inArray(schema.chats.visibility, ['admin', 'public'])
}
