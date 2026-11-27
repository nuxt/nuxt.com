import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { assertCanUseGithubTools } from '../../../lib/github.js'
import { handoffStore, receiveAttachments, SHARED_DIR } from '../../../lib/handoff.js'

export default defineTool({
  description: [
    `Copy the files the conversation shared for this task into the sandbox, under ${SHARED_DIR}: an image to add to the site, a document to work from. Call it when the message names an attached file.`,
    'Returns each file\'s `path` and size. Look at an image with `read_file`. To commit a file, copy it into the clone.',
    'An empty list means nothing was shared: say so in your reply instead of working without the file.'
  ].join(' '),
  inputSchema: z.object({}),
  label: {
    start: () => 'Fetch the shared files'
  },
  async execute(_input, ctx) {
    await assertCanUseGithubTools(ctx.session.auth.current)
    // Only the conversation that started this task can have shared with it, and the model names no session.
    const parent = ctx.session.parent?.sessionId
    if (!parent) return { files: [] }
    return { files: await receiveAttachments({ sandbox: await ctx.getSandbox(), store: handoffStore(), sessionId: parent }) }
  }
})
