import { basename } from 'node:path/posix'
import { defineTool } from 'eve/tools'
import { z } from 'zod'
import { assertCanUseGithubTools, GITHUB_REPOSITORIES } from '../../../lib/github.js'
import { CAPTURES_DIR } from '../../../lib/media/capture.js'
import { publishMedia } from '../../../lib/media/publish.js'

export default defineTool({
  description: [
    `Upload a capture from ${CAPTURES_DIR} to GitHub as an attachment of a repository, like a file dropped into a pull request description: a screenshot from \`capture_screenshot\` or a clip from \`record_video\`. Returns its \`url\` and the \`markdown\` that embeds it.`,
    'Use it for evidence: paste the `markdown` into the body of a pull request, an issue or a comment of that repository. For an image it is `![alt](url)`. For a clip it is the URL, which renders as a video player when it stands alone on a line with a blank line before and after.',
    'GitHub is checked to serve the URL before it is returned. The URL opens for everyone only once a pull request, an issue or a comment of the repository embeds it. Until then, a person who opens it can get a 404.',
    'An attachment can\'t be deleted, so publish captures of public pages only, and only the ones you will use.',
    'Not for images the site serves: those are committed to the branch with `commit_assets`.'
  ].join(' '),
  inputSchema: z.object({
    repository: z.enum(GITHUB_REPOSITORIES).default(GITHUB_REPOSITORIES[0]).describe('Repository whose pull request, issue or comment will embed the capture, as `owner/name`'),
    path: z.string().min(1).max(300).describe('A `path` that `capture_screenshot` or `record_video` returned, such as /workspace/captures/showcase-after.webp'),
    alt: z.string().trim().min(1).max(200).describe('What the capture shows, such as `World Triathlon tile on /showcase, hovered`. A clip has no alt text on GitHub, so say it in the label above the clip too.')
  }),
  label: {
    start: ({ path }) => `Publish ${basename(path)}`
  },
  async execute({ repository, path, alt }, ctx) {
    await assertCanUseGithubTools(ctx.session.auth.current)
    if (!path.startsWith(`${CAPTURES_DIR}/`) || path.includes('..')) throw new Error(`Only files under ${CAPTURES_DIR} are published.`)

    const bytes = await (await ctx.getSandbox()).readBinaryFile({ path })
    if (!bytes) throw new Error(`No file at "${path}".`)
    const published = await publishMedia({ repository, name: basename(path), bytes })

    return { ...published, markdown: published.mediaType === 'video/mp4' ? published.url : `![${alt.replace(/[[\]\n]/g, ' ')}](${published.url})` }
  }
})
