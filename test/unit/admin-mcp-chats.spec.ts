import { createMcpHandler, defineMcpTool } from 'nitro-mcp-toolkit'
import { createMcpTestClient, textOf } from 'nitro-mcp-toolkit/testing'
import { z } from 'zod'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { generateSQLiteDrizzleJson, generateSQLiteMigration } from 'drizzle-kit/api'
import { createError } from 'h3'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import * as appSchema from '../../server/db/schema'
import { adminReadableChat } from '../../server/utils/admin-chats'

vi.mock('#server/db/schema', () => import('../../server/db/schema'))

const nuxiSchema = await import('../../layers/nuxi/server/db/schema')
const schema = { ...appSchema, ...nuxiSchema }
const db = drizzle(createClient({ url: ':memory:' }), { schema })

vi.stubGlobal('defineMcpTool', defineMcpTool)
vi.stubGlobal('createError', createError)
vi.stubGlobal('adminReadableChat', adminReadableChat)
vi.stubGlobal('schema', schema)
vi.stubGlobal('db', db)

const listChats = (await import('../../server/mcp-admin/tools/list-agent-chats')).default
const getChat = (await import('../../server/mcp-admin/tools/get-agent-chat')).default
const listVotes = (await import('../../server/mcp-admin/tools/list-agent-votes')).default
const client = await createMcpTestClient(createMcpHandler({ tools: [listChats, getChat, listVotes] }))
afterAll(() => client.close())

async function callTool(name: string, args: Record<string, unknown>) {
  const result = await client.callTool({ name, arguments: args })
  expect(result.isError).not.toBe(true)
  const data: unknown = JSON.parse(textOf(result))
  return data
}

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
    const { rows } = z.object({ rows: z.array(z.object({ id: z.string() })) }).parse(await callTool('list-agent-chats', { sortBy: 'createdAt', limit: 25, offset: 0 }))
    expect(rows.map((r: { id: string }) => r.id).sort()).toEqual(['admin', 'public'])
  })

  it('applies the visibility filter alongside other filters', async () => {
    const { rows } = z.object({ rows: z.array(z.object({ id: z.string() })) }).parse(await callTool('list-agent-chats', { sinceDays: 7, hasDownvotes: true, sortBy: 'createdAt', limit: 25, offset: 0 }))
    expect(rows.map((r: { id: string }) => r.id).sort()).toEqual(['admin', 'public'])
  })

  it('reads chats shared with admins or made public', async () => {
    for (const id of ['admin', 'public']) {
      const chat = await callTool('get-agent-chat', { chatId: id, includeRawParts: false })
      expect(chat).toMatchObject({ messages: [{ text: `${id} answer` }] })
    }
  })

  it('does not read private chats', async () => {
    const result = await client.callTool({ name: 'get-agent-chat', arguments: { chatId: 'private', includeRawParts: false } })
    expect(result.isError).toBe(true)
    expect(textOf(result)).not.toContain('private answer')
  })

  it('lists votes only from chats shared with admins or made public', async () => {
    const { rows } = z.object({ rows: z.array(z.object({ chatId: z.string(), messageText: z.string() })) }).parse(await callTool('list-agent-votes', { onlyDownvotes: false, onlyUpvotes: false, limit: 50, offset: 0 }))
    expect(rows.map((r: { chatId: string, messageText: string }) => [r.chatId, r.messageText]).sort()).toEqual([
      ['admin', 'admin answer'],
      ['public', 'public answer']
    ])
  })
})
