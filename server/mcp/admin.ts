export default defineMcpHandler({
  name: 'admin',
  description: 'Authenticated MCP handler for the Nuxt team to query feedback, agent chats, and votes from the production database.',
  instructions: `You are connected to the Nuxt admin MCP. You can query user feedback (helpfulness ratings on docs pages), AI agent chat sessions (with token usage and cost), and per-message upvotes/downvotes.

Use the \`admin_*\` tools to surface trends in user satisfaction, identify problematic pages, find frustrated chat sessions, and measure agent quality. Default to recent data (last 7-30 days) unless the user asks for a longer window. Always include direct links (path / chat id) so the team can drill down on the website.`,
  middleware: (event) => {
    requireMcpAdminToken(event)
  }
})
