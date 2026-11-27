import { installAgentBrowser, quoteShellArg } from '@agent-browser/eve/sandbox'
import { DefaultSandbox, defineSandbox } from 'eve/sandbox'
import { BROWSER_LAUNCH_ARGS, PRIVATE_SUBNETS } from '../../lib/media/capture.js'

type PrepareSandbox = NonNullable<NonNullable<Parameters<typeof DefaultSandbox.environment>[0]>['prepare']>

/**
 * Chromium, agent-browser, ffmpeg and what a JavaScript project needs to install and run, installed
 * once per template: every coder session starts with a browser that can screenshot and record, and
 * can clone a repository and start its dev server (`lib/checkout.ts`). It holds no credentials.
 * Code still reaches GitHub through its API only: the tools that commit or publish run in the app
 * runtime and read the files out of the sandbox.
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

  // agent-browser reads its user config at every launch, so the `browser__*` tools and the capture
  // tools start the same Chromium whichever runs first. `args` is one string: it refuses an array.
  const config = quoteShellArg(JSON.stringify({ args: BROWSER_LAUNCH_ARGS }))
  const configured = await sandbox.run({ command: `mkdir -p "$HOME/.agent-browser" && printf '%s' ${config} > "$HOME/.agent-browser/config.json"` })
  if (configured.exitCode !== 0) throw new Error(`Could not write the agent-browser config: ${configured.stderr || configured.stdout}`)

  // `build-essential` is for a dependency that compiles a native module when it has no prebuilt binary.
  const packages = await sandbox.run({ command: 'sudo apt-get install -y --no-install-recommends ffmpeg build-essential' })
  if (packages.exitCode !== 0) throw new Error(`Could not install ffmpeg and build-essential: ${packages.stderr || packages.stdout}`)

  // The image has npm only. Corepack's `pnpm` and `yarn` run the version a project pins in
  // `packageManager`, downloaded on first use, so no project's choice is baked in here.
  const packageManagers = await sandbox.run({ command: 'npm install -g corepack bun && corepack enable' })
  if (packageManagers.exitCode !== 0) throw new Error(`Could not install the package managers: ${packageManagers.stderr || packageManagers.stdout}`)
}

export const environment = DefaultSandbox.environment({
  prepare,
  vercel: {
    // Chromium, a recording and an ffmpeg encode at once, or Chromium next to a project's dev
    // server. Memory follows at 2 GB per vCPU.
    resources: { vcpus: 4 },
    // The browser and the project's code reach the public internet and the sandbox itself, and
    // nothing else: the firewall resets a connection to a private address, whatever name, redirect
    // or tool led to it. Docker has no such rule.
    networkPolicy: { allow: ['*'], subnets: { deny: PRIVATE_SUBNETS } }
  },
  // Don't add `just-bash` to the app's dependencies for a sandbox that can't run a browser anyway.
  justBash: { autoInstall: false }
})

export default defineSandbox(() => environment.open())
