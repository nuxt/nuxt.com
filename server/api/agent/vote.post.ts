import { z } from 'zod'

const voteSchema = z.object({
  chatId: z.string().min(1),
  messageId: z.string().min(1),
  isUpvoted: z.boolean().optional()
})

export default defineEventHandler(async (event) => {
  const { chatId, messageId, isUpvoted } = await readValidatedBody(event, voteSchema.parse)

  if (isUpvoted === undefined) {
    await db.delete(schema.agentVotes).where(
      and(
        eq(schema.agentVotes.chatId, chatId),
        eq(schema.agentVotes.messageId, messageId)
      )
    )
  } else {
    await db.insert(schema.agentVotes).values({
      chatId,
      messageId,
      isUpvoted,
      createdAt: new Date()
    }).onConflictDoUpdate({
      target: [schema.agentVotes.chatId, schema.agentVotes.messageId],
      set: { isUpvoted }
    })
  }

  return { chatId, messageId, isUpvoted }
})
