import { defineTool, toolOutput, toolOutputPart } from 'eve/tools'
import { assertCanUseGithubTools } from '../../../lib/github.js'
import { recordingRequest, recordVideo } from '../../../lib/media/capture.js'

export default defineTool({
  description: [
    'Record a short clip of an interaction in the sandbox browser: `steps` play with a visible cursor while recording.',
    'Use it when a still can\'t show the change: a hover state, a menu, an animation, a scroll, a multi-step flow.',
    'A half-second pause follows every step, so the clip reads as a walkthrough; add `wait` steps where something needs longer. Keep it under ten seconds.',
    'Saves /workspace/captures/<name>.mp4, a video without sound. You get six frames spread over the clip back as one image, read left to right, then down: check that they show the interaction, then pass the returned `path` to `publish_media` to attach the clip to a pull request.'
  ].join(' '),
  inputSchema: recordingRequest,
  label: {
    start: ({ url, name }) => url ? `Record ${url}` : `Record the current page as ${name}`
  },
  async execute(input, ctx) {
    await assertCanUseGithubTools(ctx.session.auth.current)
    return recordVideo(await ctx.getSandbox(), input, ctx.abortSignal)
  },
  toModelOutput({ preview, ...recording }) {
    return toolOutput.content([
      toolOutputPart.text(`${JSON.stringify(recording)}\nSix frames spread evenly over the clip, left to right, then down:`),
      toolOutputPart.file(preview, { mediaType: 'image/webp' })
    ])
  }
})
