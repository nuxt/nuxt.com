import type { Sandbox } from '@vercel/sandbox'
import { and, eq, lt, sql } from 'drizzle-orm'
import { PROJECT_ARCHIVE_SCRIPT } from './archive'
import { TEMPLATE_WORKDIR } from './check-scripts'
import { PAUSE_TIMEOUT_MS } from './edit'

/** Vercel CLI builds the app in the sandbox: about 40s for a landing page, longer for large apps. */
const DEPLOY_TIMEOUT_MS = 4 * 60 * 1000
/**
 * A visitor starts one deploy per cooldown, from any of their previews. Longer than a deploy can run end to end (pausing editing,
 * then the command and its grace), so a reservation never expires under a deploy still using the directory.
 */
export const DEPLOY_COOLDOWN_MS = PAUSE_TIMEOUT_MS + DEPLOY_TIMEOUT_MS + 90_000
/** The wait after a failed deploy, which is shorter than the cooldown after one that finished. */
const FAILED_DEPLOY_COOLDOWN_MS = 2 * 60 * 1000
/** The CLI's temporary project lives in this directory: deploying again from it updates the same URL and claim link. */
export const DEPLOY_DIR = '/tmp/nuxt-com-deploy'
const DEPLOY_LOG = '/tmp/nuxt-com-deploy.log'

/**
 * Copies the app without the preview's helpers, its dependencies and build output (the files of the ZIP download), then deploys it
 * without a Vercel account. The CLI installs from the snapshot's package store, so the copy never writes to the running app's
 * `node_modules`. Prints the deployment URL, claim link and expiry as JSON. `.vercel/anonymous.json` also holds the project's
 * deploy token, which stays in the sandbox.
 */
function deployScript() {
  return `python3 -c "$1" /tmp/nuxt-com-deploy.zip || exit 1
mkdir -p ${DEPLOY_DIR} && find ${DEPLOY_DIR} -mindepth 1 -maxdepth 1 ! -name node_modules ! -name .vercel -exec rm -rf {} +
python3 -m zipfile -e /tmp/nuxt-com-deploy.zip ${DEPLOY_DIR} && rm -f /tmp/nuxt-com-deploy.zip || exit 1
cd ${DEPLOY_DIR}
NUXT_TELEMETRY_DISABLED=1 timeout ${DEPLOY_TIMEOUT_MS / 1000} npx -y vercel@65 deploy --temporary --yes > /tmp/nuxt-com-deploy.out 2> ${DEPLOY_LOG} || { cat /tmp/nuxt-com-deploy.out >> ${DEPLOY_LOG}; exit 1; }
URL=$(grep -E '^https://' /tmp/nuxt-com-deploy.out | tail -1) node -e "
const { claimUrl, expiresAt } = JSON.parse(require('fs').readFileSync('.vercel/anonymous.json', 'utf8'))
console.log(JSON.stringify({ url: process.env.URL, claimUrl, expiresAt }))"`
}

export interface TemplateDeployment {
  url: string
  claimUrl: string
  expiresAt: number
}

/** Takes the visitor's deploy slot unless they deployed during the cooldown. A single statement, so parallel requests can't both take it. */
/** Returns the reservation's time, which `shortenDeployCooldown` needs to change only this one. */
export async function reserveDeploy(owner: string) {
  const now = Date.now()
  await db.delete(schema.templateDeploys).where(lt(schema.templateDeploys.deployedAt, new Date(now - DEPLOY_COOLDOWN_MS)))
  const reserved = await db.all(sql`
    INSERT INTO template_deploys (owner, deployed_at) VALUES (${owner}, ${now})
    ON CONFLICT (owner) DO UPDATE SET deployed_at = excluded.deployed_at
    WHERE template_deploys.deployed_at <= ${now - DEPLOY_COOLDOWN_MS}
    RETURNING owner`)
  if (reserved.length) return now
  const [row] = await db.select().from(schema.templateDeploys).where(eq(schema.templateDeploys.owner, owner)).limit(1)
  const wait = Math.max(1, Math.ceil(((row?.deployedAt.getTime() ?? now) + DEPLOY_COOLDOWN_MS - now) / 60_000))
  throw createError({ statusCode: 429, message: `You can deploy again in ${wait} minute${wait === 1 ? '' : 's'}.` })
}

/**
 * After a failed deploy, shortens the cooldown to `FAILED_DEPLOY_COOLDOWN_MS` from now, so the visitor can fix the app and try
 * again soon, but can't start failing builds back to back.
 */
export async function shortenDeployCooldown(owner: string, reservedAt: number) {
  await db.update(schema.templateDeploys)
    .set({ deployedAt: new Date(Date.now() - DEPLOY_COOLDOWN_MS + FAILED_DEPLOY_COOLDOWN_MS) })
    .where(and(eq(schema.templateDeploys.owner, owner), eq(schema.templateDeploys.deployedAt, new Date(reservedAt))))
}

/**
 * Keeps the preview running until the deploy is done or timed out, and its preview slot with it. Never past the preview's
 * `maxLifetimeMs`: a preview too close to it can't deploy. Returns when the sandbox stops now, for the page's countdown.
 */
export async function keepPreviewForDeploy(owner: string, sandbox: Sandbox, maxLifetimeMs: number) {
  // Pausing live editing comes first, so it counts too.
  const needed = Date.now() + PAUSE_TIMEOUT_MS + DEPLOY_TIMEOUT_MS + 30_000
  if (needed > sandbox.createdAt.getTime() + maxLifetimeMs) {
    throw createError({ statusCode: 409, message: 'This preview stops too soon to deploy. Download it as a ZIP to keep your changes.' })
  }
  // An unknown expiry is treated as now: the extension then covers the whole deploy.
  const stopsAt = sandbox.expiresAt?.getTime() ?? Date.now()
  if (stopsAt >= needed) return stopsAt
  await sandbox.extendTimeout(needed - stopsAt)
  await db.update(schema.templatePreviews)
    .set({ expiresAt: new Date(needed + 60_000) })
    .where(and(eq(schema.templatePreviews.owner, owner), eq(schema.templatePreviews.id, sandbox.name)))
  return needed
}

export async function deployPreview(sandbox: Sandbox): Promise<TemplateDeployment> {
  const result = await sandbox.runCommand({
    cmd: 'bash', args: ['-c', deployScript(), 'deploy', PROJECT_ARCHIVE_SCRIPT], cwd: TEMPLATE_WORKDIR,
    // The sandbox kills the command at the same bound, so a retry never clears the deploy directory under a deploy still running.
    timeoutMs: DEPLOY_TIMEOUT_MS + 30_000,
    signal: AbortSignal.timeout(DEPLOY_TIMEOUT_MS + 30_000)
  })
  const output = (await result.stdout()).trim()
  if (result.exitCode !== 0) {
    const log = await sandbox.runCommand({ cmd: 'tail', args: ['-c', '4000', DEPLOY_LOG], signal: AbortSignal.timeout(10_000) })
      .then(command => command.stdout()).catch(() => '')
    console.error('[templates] deploy failed', log)
    throw createError({ statusCode: 502, message: 'The deploy failed. Vercel could not build this version of the app.' })
  }
  let deployment: Partial<TemplateDeployment> = {}
  try {
    deployment = JSON.parse(output.split('\n').pop()!)
  } catch {
    // Not JSON: reported below as a deploy without a claim link.
  }
  if (!deployment.url || !deployment.claimUrl?.startsWith('https://vercel.com/') || !deployment.expiresAt) {
    console.error('[templates] deploy returned no claim link', output.slice(-2000))
    throw createError({ statusCode: 502, message: 'The deploy finished without a claim link.' })
  }
  return deployment as TemplateDeployment
}
