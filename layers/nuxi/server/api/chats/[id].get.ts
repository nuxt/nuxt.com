import { createError } from 'evlog'
import { asc, eq } from 'drizzle-orm'
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const viewerId = session.user?.id

  const { id } = await getValidatedRouterParams(event, z.object({
    id: z.uuid()
  }).parse)

  const log = useLogger(event)
  log.set({
    user: { id: viewerId, authenticated: !!session.user },
    chat: { id }
  })

  const chat = await db.query.chats.findFirst({
    where: () => eq(schema.chats.id, id),
    with: {
      messages: {
        orderBy: () => [asc(schema.messages.createdAt), asc(schema.messages.id)]
      }
    }
  })

  if (!chat) {
    throw createError({ message: 'Chat not found', status: 404 })
  }

  const isOwner = viewerId !== undefined && chat.userId === viewerId
  const isAdmin = session.user?.role === 'admin'

  const canView = isOwner
    || chat.visibility === 'public'
    || (chat.visibility === 'admin' && isAdmin)

  log.set({
    chat: {
      id,
      visibility: chat.visibility,
      isOwner,
      access: isOwner ? 'owner' : (chat.visibility === 'public' ? 'public' : (isAdmin ? 'admin' : 'denied'))
    }
  })

  if (!canView) {
    throw createError({ message: 'Chat not found', status: 404, why: 'Viewer is not the owner and the chat is not public.' })
  }

  const { userId: _, ...rest } = chat
  return { ...rest, isOwner }
})
