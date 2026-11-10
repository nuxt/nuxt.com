import { createMcpHandler } from '@nuxtjs/mcp-toolkit/server'
import feedbackStats from '../../mcp-admin/tools/feedback-stats'
import listFeedback from '../../mcp-admin/tools/list-feedback'
import agentUsageStats from '../../mcp-admin/tools/agent-usage-stats'
import listAgentChats from '../../mcp-admin/tools/list-agent-chats'
import getAgentChat from '../../mcp-admin/tools/get-agent-chat'
import listAgentVotes from '../../mcp-admin/tools/list-agent-votes'

const handler = createMcpHandler({
  name: 'nuxt-admin-service',
  tools: [
    { ...feedbackStats, name: 'feedback-stats' },
    { ...listFeedback, name: 'list-feedback' },
    { ...agentUsageStats, name: 'agent-usage-stats' },
    { ...listAgentChats, name: 'list-agent-chats' },
    { ...getAgentChat, name: 'get-agent-chat' },
    { ...listAgentVotes, name: 'list-agent-votes' }
  ]
})

export default defineEventHandler((event) => {
  requireInternalRequest(event)
  return handler.fetch(toWebRequest(event), event.context)
})
