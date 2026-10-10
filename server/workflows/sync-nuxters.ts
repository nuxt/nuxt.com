import { FatalError } from 'workflow'

/**
 * Import the period files a nuxt/nuxters commit changed, then refresh /nuxters.
 *
 * Started by the push webhook (server/api/webhooks/nuxters.post.ts). Each run, its steps
 * and retries show in the Vercel dashboard (Observability → Workflows).
 *
 * On Nitro v2 (Nuxt 4), Vercel builds workflows as standalone functions, outside the Nitro
 * bundle: steps have no `db` or `useRuntimeConfig`. So they call internal routes of the app.
 */
export async function syncNuxtersWorkflow(input: { baseURL: string, sha: string }) {
  'use workflow'

  const result = await importNuxters(input.baseURL, input.sha)
  if (result.status === 'imported') {
    await purgeNuxtersPages(input.baseURL, result.imported.map(file => file.period))
  }
  return result
}

async function importNuxters(baseURL: string, sha: string) {
  'use step'

  return internalPost<{
    status: 'imported' | 'skipped'
    commitSha: string
    imported: Array<{ period: string, count: number }>
    unchanged: number
  }>(baseURL, '/api/internal/nuxters/sync', { sha })
}

async function purgeNuxtersPages(baseURL: string, periods: string[]) {
  'use step'

  return internalPost<{ purged: string[] }>(baseURL, '/api/internal/nuxters/purge', { periods })
}

async function internalPost<T>(baseURL: string, path: string, body: Record<string, unknown> = {}): Promise<T> {
  const secret = process.env.INTERNAL_API_SECRET?.trim()
  if (!secret) {
    throw new FatalError('INTERNAL_API_SECRET is not configured')
  }

  const response = await fetch(new URL(path, baseURL), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${secret}`,
      'content-type': 'application/json',
      // Lets the deployment call itself while Vercel Authentication is on (preview deploys).
      ...(process.env.VERCEL_AUTOMATION_BYPASS_SECRET ? { 'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET } : {})
    },
    body: JSON.stringify(body)
  })

  if (!response.ok) {
    const message = `${path} failed (${response.status}): ${await response.text()}`
    // A 4xx (bad sha, too few rows, bad secret) fails the same way on every retry.
    if (response.status >= 400 && response.status < 500 && response.status !== 429) {
      throw new FatalError(message)
    }
    throw new Error(message)
  }

  return await response.json() as T
}
