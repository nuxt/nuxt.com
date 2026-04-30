export default defineMcpHandler({
  name: 'admin',
  description: 'Authenticated MCP handler for the Nuxt team to query feedback, agent chats, and votes from the production database.',
  icons: [
    { src: 'https://nuxt.com/icon.png', mimeType: 'image/png', sizes: ['64x64'] }
  ],
  instructions: `You are connected to the Nuxt admin MCP. You can query user feedback (helpfulness ratings on docs pages), AI agent chat sessions (with token usage and cost), and per-message upvotes/downvotes.

Tools:
- Feedback: \`feedback-stats\`, \`list-feedback\`
- Agent: \`agent-usage-stats\`, \`list-agent-chats\`, \`get-agent-chat\`, \`list-agent-votes\`

For recurring tasks, prefer the prompts (\`summarize-feedback\`, \`triage-problematic-pages\`, \`review-agent-chats\`, \`weekly-digest\`) which already chain the right tool calls.

Default to recent data (last 7-30 days) unless the user asks for a longer window. Always include direct links (path / chat id) so the team can drill down on the website.`,
  middleware: (event) => {
    requireMcpAdminToken(event)
  }
})
