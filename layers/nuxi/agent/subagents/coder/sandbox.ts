import { installAgentBrowser } from '@agent-browser/eve/sandbox'
import { DefaultSandbox, defineSandbox } from 'eve/sandbox'
import { PRIVATE_SUBNETS } from '../../lib/media/capture.js'

type PrepareSandbox = NonNullable<NonNullable<Parameters<typeof DefaultSandbox.environment>[0]>['prepare']>

/**
 * Chromium, agent-browser and ffmpeg, installed once per template: every coder session starts with
 * a browser that can screenshot and record. It holds no checkout and no credentials. Code still
 * changes through the GitHub API, and the tools that publish or commit a capture run in the app
 * runtime and read the file out of the sandbox.
 */
const prepare: PrepareSandbox = async (sandbox) => {
  // just-bash (`eve dev` without Docker) runs no native binaries: leave it empty, and the capture
  // tools fail there with the browser's own "not installed" error.
  const native = await sandbox.run({ command: 'command -v apt-get' })
  if (native.exitCode !== 0) return

  // Chrome for Testing has no Linux arm64 build, so a Docker sandbox on Apple Silicon gets the
  // tooling without a browser.
  const { stdout: architecture } = await sandbox.run({ command: 'uname -m' })
  const installBrowser = !['arm64', 'aarch64'].includes(String(architecture).trim())

  // agent-browser passes `abortSignal`; eve's sandbox calls it `signal`.
  await installAgentBrowser(
    { run: ({ command, abortSignal }) => sandbox.run({ command, signal: abortSignal }) },
    { installBrowser, installSystemDependencies: true }
  )

  const ffmpeg = await sandbox.run({ command: 'sudo apt-get install -y --no-install-recommends ffmpeg' })
  if (ffmpeg.exitCode !== 0) throw new Error(`Could not install ffmpeg: ${ffmpeg.stderr || ffmpeg.stdout}`)
}

export const environment = DefaultSandbox.environment({
  prepare,
  vercel: {
    // Chromium, a recording and an ffmpeg encode at once.
    resources: { vcpus: 4 },
    // The browser opens any public page and nothing else: the firewall resets a connection to a
    // private address, whatever name, redirect or tool led to it. Docker has no such rule.
    networkPolicy: { allow: ['*'], subnets: { deny: PRIVATE_SUBNETS } }
  },
  // Don't add `just-bash` to the app's dependencies for a sandbox that can't run a browser anyway.
  justBash: { autoInstall: false }
})

export default defineSandbox(() => environment.open())
