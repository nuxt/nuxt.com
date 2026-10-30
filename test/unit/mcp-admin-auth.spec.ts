import { IncomingMessage, ServerResponse } from 'node:http'
import { Socket } from 'node:net'
import { createEvent } from 'h3'
import { createMcpHandler, defineMcpTool } from 'nitro-mcp-toolkit'
import { createMcpTestClient } from 'nitro-mcp-toolkit/testing'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { validateMcpAdminToken } from '../../server/utils/mcp-auth'

const request = new IncomingMessage(new Socket())
const event = createEvent(request, new ServerResponse(request))
let configuredToken = 'admin-test-token'
vi.stubGlobal('useRuntimeConfig', () => ({ mcpAdminToken: configuredToken }))
const invoked = vi.fn(() => 'admin result')
const handler = createMcpHandler({
  auth: {
    schemes: ['bearer'],
    validate: ({ token }) => validateMcpAdminToken(token, event)
  },
  tools: [defineMcpTool({ name: 'admin-only', handler: invoked })]
})

afterEach(() => {
  configuredToken = 'admin-test-token'
  invoked.mockClear()
})

describe.each(['modern', 'legacy'] as const)('admin MCP authentication (%s)', (era) => {
  it('rejects missing and invalid tokens before invoking tools', async () => {
    for (const headers of [{}, { authorization: 'Bearer incorrect' }]) {
      await expect(createMcpTestClient(handler, { era, headers })).rejects.toMatchObject({ data: { status: 401 } })
    }
    expect(invoked).not.toHaveBeenCalled()
  })

  it('checks the current runtime token on every request', async () => {
    const client = await createMcpTestClient(handler, { era, headers: { authorization: 'Bearer admin-test-token' } })
    try {
      await client.callTool({ name: 'admin-only' })
      expect(invoked).toHaveBeenCalledOnce()
      configuredToken = 'replacement-token'
      await expect(client.callTool({ name: 'admin-only' })).rejects.toMatchObject({ data: { status: 401 } })
      expect(invoked).toHaveBeenCalledOnce()
    } finally {
      await client.close()
    }
  })

  it('refuses access when no admin token is configured', async () => {
    configuredToken = ''
    await expect(createMcpTestClient(handler, { era, headers: { authorization: 'Bearer admin-test-token' } }))
      .rejects.toMatchObject({ data: { status: 401 } })
  })
})
