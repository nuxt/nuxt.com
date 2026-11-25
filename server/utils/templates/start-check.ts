/**
 * What the check verifies once a template's production server is up: it answers, every asset it references loads, and the app
 * mounts in Chromium. A failure throws `StartError`, which `checkTemplatesWorkflow` records as a failed `start` step.
 */
import type { Sandbox } from '@vercel/sandbox'
import { CHECK_BROWSER_DIR } from './check-scripts'

export class StartError extends Error {}

/**
 * Requests the template's own server and follows its redirects within it, never elsewhere.
 * This runs on the workflow worker, not in the sandbox, so a URL the template controls could otherwise reach the worker's network.
 */
async function fetchFromSandbox(url: URL, timeoutMs: number) {
  for (let hops = 0; hops <= 5; hops++) {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(timeoutMs) })
    const location = response.status >= 300 && response.status < 400 ? response.headers.get('location') : null
    const next = location ? new URL(location, url) : null
    if (!next || next.origin !== url.origin) return { response, url }
    await response.body?.cancel()
    url = next
  }
  throw new StartError(`${url.origin} redirected too many times`)
}

/** The page answers, and every stylesheet and script it references loads. A page that renders without them looks broken. */
export async function smokeTest(url: string) {
  const deadline = Date.now() + 60_000
  let page: { response: Response, url: URL } | null = null
  while (Date.now() < deadline) {
    page = await fetchFromSandbox(new URL(url), 5000).catch(() => null)
    if (page && page.response.status < 500) break
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  if (!page || page.response.status >= 400) throw new StartError(`${url} answered ${page?.response.status ?? 'nothing'}`)

  const { response, url: pageUrl } = page
  const html = await response.text()
  const assets = [...new Set([...html.matchAll(/(?:href|src)="(\/[^"]+\.(?:css|js|mjs))"/g)].map(match => match[1]!))]
    // `//host/app.js` points to another server: only the template's own assets are checked.
    .filter(asset => new URL(asset, pageUrl).origin === pageUrl.origin)
  const failed: string[] = []
  await Promise.all(assets.slice(0, 40).map(async (asset) => {
    const status = await fetchFromSandbox(new URL(asset, pageUrl), 10_000).then(res => res.response.status).catch(() => 0)
    if (status !== 200) failed.push(`${status} ${asset}`)
  }))
  if (failed.length) throw new StartError(`${failed.length}/${assets.length} assets failed to load:\n${failed.slice(0, 5).join('\n')}`)
}

/** The app mounts in a real browser without crashing. */
export async function browserTest(browser: Sandbox, url: string) {
  const visit = await browser.runCommand({ cmd: 'node', args: ['visit.mjs', url], cwd: CHECK_BROWSER_DIR })
  if (visit.exitCode !== 0) throw new StartError(`The browser could not open ${url}:\n${(await visit.output()).slice(-800)}`)
  const { result, errors } = JSON.parse((await visit.stdout()).trim().split('\n').pop()!) as { result: { type: string, message?: string } | null, errors: string[] }
  if (result?.type === 'ready') return
  const details = result?.type === 'error' ? `It crashed in the browser: ${result.message}` : 'It never finished mounting in the browser.'
  throw new StartError([details, ...errors.slice(0, 3)].join('\n'))
}
