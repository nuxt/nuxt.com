import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from 'drizzle-kit/api'
import { createError } from 'h3'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import * as appSchema from '../../server/db/schema'
import { adminReadableChat } from '../../server/utils/admin-chats'

vi.mock('#server/db/schema', () => import('../../server/db/schema'))

const nuxiSchema = await import('../../layers/nuxi/server/db/schema')
const schema = { ...appSchema, ...nuxiSchema }
const db = drizzle(createClient({ url: ':memory:' }), { schema })

vi.stubGlobal('defineMcpTool', <T>(definition: T) => definition)
vi.stubGlobal('createError', createError)
vi.stubGlobal('isMcpAdmin', () => true)
vi.stubGlobal('adminReadableChat', adminReadableChat)
vi.stubGlobal('schema', schema)
vi.stubGlobal('db', db)

type Tool = { handler: (input: Record<string, unknown>) => Promise<any> }
const listChats = (await import('../../server/mcp/tools/admin/list-agent-chats')).default as unknown as Tool
const getChat = (await import('../../server/mcp/tools/admin/get-agent-chat')).default as unknown as Tool
const listVotes = (await import('../../server/mcp/tools/admin/list-agent-votes')).default as unknown as Tool

const visibilities = ['private', 'admin', 'public'] as const

beforeAll(async () => {
  const statements = await generateSQLiteMigration(await generateSQLiteDrizzleJson({}), await generateSQLiteDrizzleJson(schema))
  for (const statement of statements) await db.run(statement)

  await db.insert(schema.users).values({ id: 'user', name: 'User', avatar: '', username: 'user', provider: 'github', providerId: '1' })
  for (const visibility of visibilities) {
    await db.insert(schema.chats).values({ id: visibility, userId: 'user', title: `${visibility} title`, visibility })
    await db.insert(schema.messages).values({ id: 'm1', chatId: visibility, role: 'assistant', parts: [{ type: 'text', text: `${visibility} answer` }] })
    await db.insert(schema.votes).values({ chatId: visibility, messageId: 'm1', isUpvoted: false })
  }
})

describe('admin agent chat tools', () => {
  it('lists only chats shared with admins or made public', async () => {
    const { rows } = await listChats.handler({ sortBy: 'createdAt', limit: 25, offset: 0 })
    expect(rows.map((r: { id: string }) => r.id).sort()).toEqual(['admin', 'public'])
  })

  it('applies the visibility filter alongside other filters', async () => {
    const { rows } = await listChats.handler({ sinceDays: 7, hasDownvotes: true, sortBy: 'createdAt', limit: 25, offset: 0 })
    expect(rows.map((r: { id: string }) => r.id).sort()).toEqual(['admin', 'public'])
  })

  it('reads chats shared with admins or made public', async () => {
    for (const id of ['admin', 'public']) {
      const chat = await getChat.handler({ chatId: id, includeRawParts: false })
      expect(chat.messages[0].text).toBe(`${id} answer`)
    }
  })

  it('does not read private chats', async () => {
    await expect(getChat.handler({ chatId: 'private', includeRawParts: false })).rejects.toMatchObject({ statusCode: 404 })
  })

  it('lists votes only from chats shared with admins or made public', async () => {
    const { rows } = await listVotes.handler({ onlyDownvotes: false, onlyUpvotes: false, limit: 50, offset: 0 })
    expect(rows.map((r: { chatId: string, messageText: string }) => [r.chatId, r.messageText]).sort()).toEqual([
      ['admin', 'admin answer'],
      ['public', 'public answer']
    ])
  })
})
