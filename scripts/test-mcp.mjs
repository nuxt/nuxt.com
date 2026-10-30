import assert from 'node:assert/strict'
import { createMcpTestClient, textOf } from 'nitro-mcp-toolkit/testing'

const base = process.env.MCP_TEST_URL || 'http://localhost:3000'
const adminToken = process.env.MCP_TEST_ADMIN_TOKEN
const remote = { fetch: request => fetch(request) }
for (const era of ['modern', 'legacy']) {
  const client = await createMcpTestClient(remote, { url: `${base}/mcp`, era })
  try {
    const { tools } = await client.listTools()
    assert.equal(tools.length, 12)
    assert(!tools.some(tool => tool._meta?.group === 'admin'))
    const { resources } = await client.listResources()
    const { prompts } = await client.listPrompts()
    assert.equal(resources.length, 3)
    assert.equal(prompts.length, 3)
    const page = await client.callTool({ name: 'get-documentation-page', arguments: { path: '/docs/4.x/getting-started/introduction' } })
    assert(!page.isError, textOf(page))
    assert(textOf(page).includes('Nuxt'))
    const pageAgain = await client.callTool({ name: 'get-documentation-page', arguments: { path: '/docs/4.x/getting-started/introduction' } })
    assert.equal(textOf(pageAgain), textOf(page))
    const blogs = await client.callTool({ name: 'list-blog-posts' })
    assert(!blogs.isError, textOf(blogs))
    const resource = await client.readResource({ uri: resources.find(r => r.name === 'nuxt-deploy-providers').uri })
    assert(textOf(resource).includes('Vercel'))
    const prompt = await client.getPrompt({ name: 'find-documentation-for-topic', arguments: { topic: 'data fetching', version: '4.x' } })
    assert(textOf(prompt).includes('data fetching'))
    for (const headers of [{}, { authorization: 'Bearer wrong-token' }]) {
      await assert.rejects(() => createMcpTestClient(remote, { url: `${base}/mcp/admin`, era, headers }), /Unauthorized|401/)
    }
    if (!adminToken) {
      console.log(`${era}: public 12 tools / 3 resources / 3 prompts; documentation, repeated read, blog, resource and prompt OK; admin rejects missing and invalid tokens (authenticated checks need MCP_TEST_ADMIN_TOKEN)`)
      continue
    }
    const admin = await createMcpTestClient(remote, { url: `${base}/mcp/admin`, era, headers: { authorization: `Bearer ${adminToken}` } })
    try {
      const { tools: adminTools } = await admin.listTools()
      const { prompts: adminPrompts } = await admin.listPrompts()
      assert.equal(adminTools.length, 10)
      assert.equal(adminPrompts.length, 5)
      const adminPrompt = await admin.getPrompt({ name: 'review-agent-chats', arguments: { sinceDays: '3', worst: '2' } })
      assert(textOf(adminPrompt).includes('last 3 days'))
      assert(textOf(adminPrompt).includes('limit=2'))
      console.log(`${era}: public 12 tools / 3 resources / 3 prompts; docs, repeated read, blog, resource and prompt OK; admin 10 tools / 5 prompts; missing and invalid tokens rejected`)
    } finally { await admin.close() }
  } finally { await client.close() }
}
const response = await fetch(`${base}/.well-known/mcp/server-card.json`)
assert.equal(response.status, 200)
const card = await response.json()
assert.equal(card.tools.length, 12)
assert.equal(card.resources.length, 3)
assert.equal(card.prompts.length, 3)
assert.equal(response.headers.get('cache-control'), 'no-cache')
assert(!JSON.stringify(card).includes('get-agent-chat'))
console.log('server card: public catalog only, no-cache OK')
