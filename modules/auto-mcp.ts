import process from 'node:process'
import { execSync } from 'node:child_process'
import { homedir } from 'node:os'
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'pathe'
import { defineNuxtModule } from 'nuxt/kit'
import { consola } from 'consola'
import { $fetch } from 'ofetch'

export interface ModuleOptions {}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'auto-mcp',
    configKey: 'autoMCP'
  },
  defaults: {},
  setup(_options, nuxt) {
    if (!nuxt.options.dev && !nuxt.options._prepare) {
      return
    }

    nuxt.hooks.hook('modules:done', async () => {
      const ide = detectIDE()
      if (!ide) {
        return
      }
      const modulesWithMCP = await $fetch('https://api.nuxt.com/modules').then((res: any) => res.modules.filter((module: any) => module.mcp).map(({ name, npm, mcp }: any) => ({ name, npm, mcp })))
      const localMcpJson = join(nuxt.options.rootDir, `.${ide}/mcp.json`)
      const globalMcpJson = join(homedir(), `.${ide}/mcp.json`)
      const mcpConfigs = {
        localMcpJson: existsSync(localMcpJson) ? JSON.parse(readFileSync(localMcpJson, 'utf8')) : {},
        globalMcpJson: existsSync(globalMcpJson) ? JSON.parse(readFileSync(globalMcpJson, 'utf8')) : {}
      }

      const mcpToInstall = []
      if (!isMCPInstalled(mcpConfigs, 'https://nuxt.com/mcp')) {
        mcpToInstall.push({
          name: 'nuxt',
          url: 'https://nuxt.com/mcp'
        })
      }
      for (const module of modulesWithMCP) {
        if (!isMCPInstalled(mcpConfigs, module.mcp)) {
          mcpToInstall.push({
            name: module.npm,
            url: module.mcp
          })
        }
      }
      if (mcpToInstall.length > 0) {
        consola.info([
          `${IDE_CONFIGS[ide].name} detected with ${mcpToInstall.length} MCP server${mcpToInstall.length > 1 ? 's' : ''} recommended:`,
          ...mcpToInstall.map(mcp => `- ${terminalLink(`Install \`${mcp.name}\` MCP server`, IDE_CONFIGS[ide].generateDeeplink(mcp.name, mcp.url))}`)
        ].join('\n'))
      }
    })
  }
})

type SupportedIDE = 'cursor' | 'vscode'

interface IDEConfig {
  name: string
  generateDeeplink: (serverName: string, mcpUrl: string) => string
}

const IDE_CONFIGS: Record<SupportedIDE, IDEConfig> = {
  cursor: {
    name: 'Cursor',
    generateDeeplink: (serverName: string, mcpUrl: string) => {
      const config = { type: 'http', url: mcpUrl }
      const configBase64 = Buffer.from(JSON.stringify(config)).toString('base64')
      return `cursor://anysphere.cursor-deeplink/mcp/install?name=${encodeURIComponent(serverName)}&config=${encodeURIComponent(configBase64)}`
    }
  },
  vscode: {
    name: 'VS Code',
    generateDeeplink: (serverName: string, mcpUrl: string) => {
      const config = { name: serverName, type: 'http', url: mcpUrl }
      return `vscode:mcp/install?${encodeURIComponent(JSON.stringify(config))}`
    }
  }
}

function detectIDE(): SupportedIDE | null {
  const env = process.env
  if (env.__CFBundleIdentifier === 'com.todesktop.230313mzl4w4u92') return 'cursor'
  if (env.__CFBundleIdentifier === 'com.microsoft.VSCode') return 'vscode'
  if (env.CURSOR_TRACE_ID) return 'cursor'
  const ipc = env.VSCODE_IPC_HOOK || ''
  if (ipc.includes('/Cursor/')) return 'cursor'
  if (ipc.includes('/Code/')) return 'vscode'

  // Fallback: walk up the process tree to find Cursor or VS Code
  try {
    let pid = process.ppid
    for (let i = 0; i < 10 && pid > 1; i++) {
      const name = execSync(`ps -o comm= -p ${pid}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().toLowerCase()
      if (name.includes('cursor')) return 'cursor'
      if (name.includes('code helper') || name.includes('code.app')) return 'vscode'
      pid = Number.parseInt(execSync(`ps -o ppid= -p ${pid}`, { stdio: ['pipe', 'pipe', 'ignore'] }).toString().trim())
    }
  } catch {
    // Process tree detection failed, continue with null
  }

  return null
}

function terminalLink(text: string, url: string): string {
  return `\x1B]8;;${url}\x07${text}\x1B]8;;\x07`
}

function isMCPInstalled(mcpConfigs: { localMcpJson: any, globalMcpJson: any }, url: string): boolean {
  return Object.values(mcpConfigs.localMcpJson.mcpServers ?? {}).some((server: any) => server.url === url)
    || Object.values(mcpConfigs.globalMcpJson.mcpServers ?? {}).some((server: any) => server.url === url)
    || false
}
