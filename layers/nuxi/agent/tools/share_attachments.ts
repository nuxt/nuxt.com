import { defineDynamic, defineTool } from 'eve/tools'
import { z } from 'zod'
import { assertCanUseGithubTools, canUseGithubTools } from '../lib/github.js'
import { ATTACHMENTS_DIR, handoffStore, MAX_SHARED_FILES, shareAttachments } from '../lib/handoff.js'

// Offered to the people who are offered `coder`, and useless without it. `coder` has its own sandbox
// and receives only the text of its task, so a file someone attached here never reaches it by itself.
export default defineDynamic(async (ctx) => {
  const auth = ctx.session.auth.current
  if (!(await ctx.memo(ctx.turn?.id ?? null, () => canUseGithubTools(auth)))) return null

  return defineTool({
    description: [
      'Give `coder` files attached to this conversation, such as an image to add to the site or a document to work from. `coder` does not see attachments otherwise.',
      `Call it before \`coder\`, with the paths from the \`Attached file ${ATTACHMENTS_DIR}/…\` labels, then give each returned \`path\` in the message to \`coder\` and say what to do with the file.`,
      'Share only the files the task needs. They stay available to `coder` for an hour.'
    ].join(' '),
    inputSchema: z.object({
      paths: z.array(z.string().min(1).max(500)).min(1).max(MAX_SHARED_FILES).describe(`Attachment paths, such as ${ATTACHMENTS_DIR}/3f2a9c1e/cover.png`)
    }),
    label: {
      start: ({ paths }) => `Share ${paths.length === 1 ? 'a file' : `${paths.length} files`} with coder`
    },
    async execute({ paths }, toolCtx) {
      await assertCanUseGithubTools(toolCtx.session.auth.current)
      return { files: await shareAttachments({ sandbox: await toolCtx.getSandbox(), store: handoffStore(), sessionId: toolCtx.session.id, paths }) }
    }
  })
})
