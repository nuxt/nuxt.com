import { readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'

const registryPath = join(process.cwd(), '.eve/nuxt-dev-server.json')
const lockPath = join(process.cwd(), '.eve/nuxt-dev-server.lock')
const eveCachePath = join(process.cwd(), 'node_modules/.cache/eve')

async function clearEveDevArtifacts() {
  await rm(registryPath, { force: true })
  await rm(lockPath, { force: true })
  await rm(eveCachePath, { recursive: true, force: true })
}

try {
  const registry = JSON.parse(await readFile(registryPath, 'utf8'))
  const origin = typeof registry.origin === 'string' ? registry.origin : null

  if (!origin) {
    await clearEveDevArtifacts()
    process.exit(0)
  }

  const response = await fetch(`${origin}/eve/v1/health`, {
    signal: AbortSignal.timeout(1500)
  })

  if (!response.ok) {
    await clearEveDevArtifacts()
  }
} catch {
  await clearEveDevArtifacts()
}
