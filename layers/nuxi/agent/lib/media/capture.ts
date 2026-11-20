import { BlockList, isIPv4 } from 'node:net'
import { quoteShellArg as quote, runAgentBrowser, type EveToolContext } from '@agent-browser/eve/sandbox'
import { z } from 'zod'

/** One browser per sandbox: the `browser__*` tools and the capture tools drive the same page. */
export const BROWSER_SESSION = 'nuxi'

/**
 * Launch flags of the sandbox's Chromium, which `subagents/coder/sandbox.ts` writes to agent-browser's
 * user config. Headless Chromium reports no mouse, so `(hover: hover)` doesn't match and a site built
 * with Tailwind v4 never shows its `hover:` styles in a capture. These Blink settings make it report
 * one. The setting is per browser, so the `tablet` and `mobile` viewports report a mouse too.
 */
export const BROWSER_LAUNCH_ARGS = '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4'

/** Where captures land in the sandbox, as `<name>.<ext>`. */
export const CAPTURES_DIR = '/workspace/captures'

const VIEWPORTS = {
  desktop: { width: 1280, height: 720 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 390, height: 844 }
}

/** Between two recorded steps, so the clip reads as a walkthrough. */
const STEP_PAUSE_MS = 500
/** Frames per second of a clip. The recorder captures at this rate too: at its default of 30, its encoder falls behind in a slow sandbox and the recording fails. */
const CLIP_FPS = 12
/** Frames in a clip's preview, three per row. */
const PREVIEW_FRAMES = 6
/** How long stopping the recorder may take. agent-browser sets no limit, and a stop that hangs would hold the turn. */
const STOP_TIMEOUT_MS = 60_000

const selectors = z.array(z.string().min(1).max(200)).max(20).optional()

/** What both capture tools take: the page, and what to take out of the frame. */
const page = {
  name: z.string().regex(/^[a-z0-9][a-z0-9-]{0,62}$/, 'Lowercase letters, digits and hyphens only').describe('File name without extension, such as `world-triathlon`. A capture with the same name is replaced.'),
  url: z.string().optional().describe('Public http(s) URL to open. Omit to use the page the `browser__*` tools left open, in the state they left it.'),
  viewport: z.enum(['desktop', 'tablet', 'mobile']).optional().describe('desktop 1280x720 (default), tablet 768x1024 or mobile 390x844'),
  colorScheme: z.enum(['light', 'dark']).optional().describe('Emulated `prefers-color-scheme`. Omit for the browser\'s default, which is light.'),
  cookies: z.array(z.string().min(3).max(2000)).max(10).optional().describe('Cookies set before the page opens, as `name=value`, such as a consent cookie. Needs `url`.'),
  hideElements: selectors.describe('CSS selectors hidden with `visibility: hidden`, such as `#onetrust-consent-sdk`. The element keeps its place in the layout.'),
  removeElements: selectors.describe('CSS selectors removed with `display: none`. Use it for a widget that `hideElements` leaves in the frame, or a bar whose empty space should close up.')
}

/** `cookies`, `hideElements`, `removeElements`, `scripts` and `delay` match `screenshotOptions` in the content files, so what works here can be saved there. */
export const screenshotRequest = z.object({
  ...page,
  scripts: z.array(z.string().min(1).max(2000)).max(5).optional().describe('JavaScript run in the page before the frame, such as a click that dismisses a dialog'),
  delay: z.number().min(0).max(15).optional().describe('Seconds to wait before the frame, for fonts, images and entrance animations. Default 2.'),
  selector: z.string().min(1).max(200).optional().describe('CSS selector or `@ref` scrolled into view before the frame'),
  quality: z.number().int().min(1).max(100).optional().describe('WebP quality. Default 80. Lower it when the file is too large for `commit_assets`.')
})

const target = z.string().min(1).max(200).describe('CSS selector or `@ref` from `browser__snapshot`')

const recordingStep = z.discriminatedUnion('action', [
  z.object({ action: z.literal('wait'), ms: z.number().int().min(100).max(5000) }),
  z.object({ action: z.literal('scroll'), direction: z.enum(['up', 'down']), px: z.number().int().min(50).max(3000) }),
  z.object({ action: z.literal('scroll_to'), selector: target }),
  z.object({ action: z.literal('hover'), selector: target }),
  z.object({ action: z.literal('click'), selector: target }),
  z.object({ action: z.literal('press'), key: z.string().min(1).max(40).describe('Such as `Enter`, `Escape` or `Control+k`') }),
  z.object({ action: z.literal('type'), selector: target, text: z.string().max(500) })
])

export const recordingRequest = z.object({
  ...page,
  steps: z.array(recordingStep).min(1).max(20).describe('Played in order while recording')
})

type PageRequest = z.infer<typeof recordingRequest> | z.infer<typeof screenshotRequest>

/** The sandbox methods a capture needs; eve's `SandboxSession` satisfies it. */
export interface MediaSandbox {
  run(options: { command: string, signal?: AbortSignal }): PromiseLike<{ exitCode?: number, stdout?: string, stderr?: string }>
  readBinaryFile(options: { path: string }): PromiseLike<Uint8Array | null>
}

/**
 * The IPv4 ranges that are not the public internet: 100.64/10 holds a cloud metadata address, and
 * 224/3 is multicast and above. On Vercel, the sandbox's firewall refuses every connection to them
 * (`subagents/coder/sandbox.ts`).
 */
export const PRIVATE_SUBNETS = ['10.0.0.0/8', '100.64.0.0/10', '169.254.0.0/16', '172.16.0.0/12', '192.0.0.0/24', '192.168.0.0/16', '198.18.0.0/15', '224.0.0.0/3']

const privateAddresses = new BlockList()
// 0/8 and loopback never leave the sandbox, so only the URL check knows them.
for (const subnet of [...PRIVATE_SUBNETS, '0.0.0.0/8', '127.0.0.0/8']) {
  const [network = '', prefix] = subnet.split('/')
  privateAddresses.addSubnet(network, Number(prefix))
}
const LOCAL_NAME = /^(?:localhost|.*\.(?:localhost|local|internal))$/

/**
 * Why `raw` can't be captured, or null: public http(s) pages only. It reads the URL and resolves
 * nothing, so it stops a mistake with a clear message. A hostname that points to a private address,
 * a redirect to one and the `browser__*` tools are the firewall's to refuse.
 */
export function captureUrlError(raw: string): string | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return `"${raw}" is not an absolute URL.`
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return `"${raw}" must use http(s).`
  if (url.username || url.password) return 'URLs with credentials are not captured.'
  // `localhost.` resolves like `localhost`.
  const host = url.hostname.toLowerCase().replace(/\.$/, '')
  // An IPv6 literal is refused whatever it is. `URL` writes every IPv4 form as dotted decimal.
  if (host.startsWith('[') || LOCAL_NAME.test(host) || (isIPv4(host) && privateAddresses.check(host))) return `"${host}" is a local or private address.`
  return null
}

/** `name=value` from a cookie string as `screenshotOptions.cookies` writes them, such as `consent=1;`. */
export function parseCookie(cookie: string): { name: string, value: string } | null {
  const pair = cookie.split(';')[0]!.trim()
  const separator = pair.indexOf('=')
  if (separator <= 0) return null
  return { name: pair.slice(0, separator).trim(), value: pair.slice(separator + 1).trim() }
}

/**
 * JavaScript that adds a stylesheet to the page. A stylesheet, not a one-off query, so a banner
 * that mounts after the page loads is covered too. `JSON.stringify` leaves `<`, `>`, U+2028 and
 * U+2029 as they are, and they can end a script or a line, so they are escaped.
 */
function styleExpression(css: string): string {
  const literal = JSON.stringify(css).replace(/[<>\u2028\u2029]/g, char => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`)
  return `(() => { const style = document.createElement('style'); style.textContent = ${literal}; document.head.append(style); return true })()`
}

/** Like capture-website's `hideElements`: the element keeps its place in the layout. */
export function hideElementsExpression(selectors: readonly string[]): string {
  return styleExpression(`${selectors.join(', ')} { visibility: hidden !important }`)
}

/** Like capture-website's `removeElements`. A child can override its parent's `visibility` and stay in the frame; nothing overrides a parent that isn't displayed. */
export function removeElementsExpression(selectors: readonly string[]): string {
  return styleExpression(`${selectors.join(', ')} { display: none !important }`)
}

/** The agent-browser command for one recorded step. */
export function stepCommand(step: z.infer<typeof recordingStep>): string[] {
  switch (step.action) {
    case 'wait': return ['wait', String(step.ms)]
    case 'scroll': return ['scroll', step.direction, String(step.px)]
    case 'scroll_to': return ['scrollintoview', step.selector]
    case 'hover': return ['hover', step.selector]
    case 'click': return ['click', step.selector]
    case 'press': return ['press', step.key]
    case 'type': return ['type', step.selector, step.text]
  }
}

type Runner = ReturnType<typeof runner>

function runner(sandbox: MediaSandbox, signal?: AbortSignal) {
  // agent-browser passes `abortSignal`; eve's sandbox calls it `signal`.
  const ctx: EveToolContext = { getSandbox: () => Promise.resolve({ run: ({ command }) => sandbox.run({ command, signal }) }) }
  return {
    async browser<T = Record<string, unknown>>(...args: string[]): Promise<T | undefined> {
      const result = await runAgentBrowser<{ data?: T }>(ctx, args, { session: BROWSER_SESSION, abortSignal: signal })
      return result.json?.data
    },
    async shell(command: string): Promise<string> {
      const result = await sandbox.run({ command, signal })
      if (result.exitCode) {
        throw new Error(`\`${command.split(' ')[0]}\` exited ${result.exitCode}: ${(result.stderr || result.stdout || '').trim().slice(-600)}`)
      }
      return String(result.stdout ?? '')
    }
  }
}

/** Size the viewport, open `url` when given, and take what is in the way out of the frame. */
async function preparePage(run: Runner, request: PageRequest, scale: 1 | 2) {
  const viewport = VIEWPORTS[request.viewport ?? 'desktop']

  await run.shell(`mkdir -p ${CAPTURES_DIR}`)
  await run.browser('set', 'viewport', String(viewport.width), String(viewport.height), String(scale))
  // Set on every capture: the browser keeps the scheme, and without a value it goes back to its default.
  await run.browser('set', 'media', ...(request.colorScheme ? [request.colorScheme] : []))

  if (request.url) {
    const reason = captureUrlError(request.url)
    if (reason) throw new Error(reason)
    for (const cookie of request.cookies ?? []) {
      const parsed = parseCookie(cookie)
      if (!parsed) throw new Error(`Cookie "${cookie}" is not a name=value pair.`)
      await run.browser('cookies', 'set', parsed.name, parsed.value, '--url', request.url)
    }
    await run.browser('open', request.url)
  } else if (request.cookies?.length) {
    throw new Error('`cookies` are set before a page opens: pass `url` with them.')
  }

  if (request.hideElements?.length) await run.browser('eval', hideElementsExpression(request.hideElements))
  if (request.removeElements?.length) await run.browser('eval', removeElementsExpression(request.removeElements))
  return viewport
}

/** The URL of the page the browser shows, refused when it isn't public: the `browser__*` tools, a redirect or a click may have led anywhere. */
async function shownUrl(run: Runner) {
  const url = (await run.browser<{ url?: string }>('get', 'url'))?.url ?? ''
  const reason = captureUrlError(url)
  if (reason) throw new Error(`The browser shows a page that can't be captured: ${reason}`)
  return url
}

/** A capture's file size and its preview as base64: an image small enough to show the model. */
async function captured(run: Runner, sandbox: MediaSandbox, path: string, previewPath: string) {
  const preview = await sandbox.readBinaryFile({ path: previewPath })
  if (!preview) throw new Error(`The capture left no preview at ${previewPath}.`)
  return {
    path,
    bytes: Number((await run.shell(`stat -c %s ${quote(path)}`)).trim()),
    preview: Buffer.from(preview).toString('base64')
  }
}

/**
 * Captures run one at a time. They drive the same browser, and eve runs the tool calls of one model
 * step together: a second capture would move the page under the first, or find the recorder busy.
 */
let lastCapture: Promise<unknown> = Promise.resolve()
function oneAtATime<T>(capture: () => Promise<T>): Promise<T> {
  const result = lastCapture.then(capture)
  lastCapture = result.catch(() => {})
  return result
}

/** One frame of a page, saved as `<name>.webp` at 2x: a 1280x720 viewport gives the 2560x1440 of the showcase and template images. */
export const captureScreenshot = (...args: Parameters<typeof screenshot>) => oneAtATime(() => screenshot(...args))

async function screenshot(sandbox: MediaSandbox, request: z.infer<typeof screenshotRequest>, signal?: AbortSignal) {
  const run = runner(sandbox, signal)
  const base = `${CAPTURES_DIR}/${request.name}`

  const { width, height } = await preparePage(run, request, 2)
  for (const script of request.scripts ?? []) await run.browser('eval', script)
  await run.browser('wait', String(Math.round((request.delay ?? 2) * 1000)))
  if (request.selector) {
    await run.browser('scrollintoview', request.selector)
    await run.browser('wait', '300')
  }

  const url = await shownUrl(run)
  const title = (await run.browser<{ title?: string }>('get', 'title'))?.title ?? ''
  await run.browser('screenshot', `${base}.png`)
  await run.shell(`ffmpeg -y -loglevel error -i ${quote(`${base}.png`)} -c:v libwebp -quality ${request.quality ?? 80} ${quote(`${base}.webp`)}`)
  await run.shell(`ffmpeg -y -loglevel error -i ${quote(`${base}.png`)} -vf scale=iw/2:-2 -c:v libwebp -quality 60 ${quote(`${base}.preview.webp`)}`)
  await run.shell(`rm -f ${quote(`${base}.png`)}`)

  return { url, title, width: width * 2, height: height * 2, ...await captured(run, sandbox, `${base}.webp`, `${base}.preview.webp`) }
}

/**
 * A short clip of the steps, played with a visible cursor and saved as `<name>.mp4`: GitHub plays
 * a video inline from its own attachments only, which is where `publish_media` uploads it. Its
 * preview is one image of frames spread evenly over the clip. ffmpeg builds it once the recording
 * is done: the recorder's own contact sheet is analysed while it records, and fails the recording
 * when a slow sandbox can't keep up.
 */
export const recordVideo = (...args: Parameters<typeof recording>) => oneAtATime(() => recording(...args))

async function recording(sandbox: MediaSandbox, request: z.infer<typeof recordingRequest>, signal?: AbortSignal) {
  const run = runner(sandbox, signal)
  const base = `${CAPTURES_DIR}/${request.name}`

  // 1x: the recorder captures frames as screenshots, and 2x frames quadruple the clip for no gain at video sizes.
  await preparePage(run, request, 1)
  await run.browser('wait', '1000')
  const url = await shownUrl(run)

  // The recorder outlives this call, so it is stopped without the turn's signal: a cancelled turn must not leave it running.
  const stop = () => runner(sandbox, AbortSignal.timeout(STOP_TIMEOUT_MS)).browser('record', 'stop')
  try {
    await run.browser('record', 'start', `${base}.webm`, '--cursor', '--fps', String(CLIP_FPS))
    await run.browser('wait', String(STEP_PAUSE_MS))
    for (const step of request.steps) {
      await run.browser(...stepCommand(step))
      if (step.action !== 'wait') await run.browser('wait', String(STEP_PAUSE_MS))
      // A step can navigate. Checked after the pause, once a navigation has had time to land.
      await shownUrl(run)
    }
  } catch (error) {
    // Nothing recorded so far is kept: it may show a page that isn't public.
    await stop().catch(() => {})
    await runner(sandbox).shell(`rm -f ${quote(`${base}.webm`)}`).catch(() => {})
    throw error
  }
  await stop()

  const seconds = Number(await run.shell(`ffprobe -v error -show_entries format=duration -of csv=p=0 ${quote(`${base}.webm`)}`)) || 0
  // H.264 in yuv420p plays in every browser; `faststart` lets it play before it has loaded in full.
  await run.shell(`ffmpeg -y -loglevel error -i ${quote(`${base}.webm`)} -c:v libx264 -pix_fmt yuv420p -movflags +faststart -an ${quote(`${base}.mp4`)}`)
  await run.shell(`ffmpeg -y -loglevel error -i ${quote(`${base}.webm`)} -vf "fps=${PREVIEW_FRAMES}/${Math.max(seconds, 1)},scale=540:-2,tile=3x2" -frames:v 1 -c:v libwebp -quality 60 ${quote(`${base}.preview.webp`)}`)
  await run.shell(`rm -f ${quote(`${base}.webm`)}`)

  return { url, seconds: Math.round(seconds * 10) / 10, ...await captured(run, sandbox, `${base}.mp4`, `${base}.preview.webp`) }
}
