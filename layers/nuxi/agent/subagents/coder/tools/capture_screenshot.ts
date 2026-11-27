import { defineTool, toolOutput, toolOutputPart } from 'eve/tools'
import { assertCanUseGithubTools } from '../../../lib/github.js'
import { captureScreenshot, screenshotRequest } from '../../../lib/media/capture.js'

export default defineTool({
  description: [
    'Screenshot a web page in the sandbox browser and look at it: the frame comes back as an image.',
    'Saves a 2x WebP at /workspace/captures/<name>.webp: 2560x1440 for the default desktop viewport.',
    'Use `cookies`, `hideElements`, `removeElements`, `scripts` and `delay` to get a cookie banner, a chat widget or a splash screen out of the frame, then look at the result and call again until the frame is clean.',
    'To add the image to a repository, copy the file at the returned `path` into the clone. To get its link, for evidence in a pull request or your reply, pass the `path` to `publish_media`.'
  ].join(' '),
  inputSchema: screenshotRequest,
  label: {
    start: ({ url, name }) => url ? `Screenshot ${url}` : `Screenshot the current page as ${name}`
  },
  async execute(input, ctx) {
    await assertCanUseGithubTools(ctx.session.auth.current)
    return captureScreenshot(await ctx.getSandbox(), input, ctx.abortSignal)
  },
  toModelOutput({ preview, ...screenshot }) {
    return toolOutput.content([
      toolOutputPart.text(`${JSON.stringify(screenshot)}\nThe frame at half size:`),
      toolOutputPart.file(preview, { mediaType: 'image/webp' })
    ])
  }
})
