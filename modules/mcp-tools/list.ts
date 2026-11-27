import { existsSync, readdirSync } from 'node:fs'
import { basename, extname, join } from 'pathe'

export interface McpToolsList {
  /** Tool names, as `@nuxtjs/mcp-toolkit` derives them from the file names. */
  tools: string[]
  /** The folders of each kind, as the tree on `/agents` shows them. */
  dirs: Record<'tools' | 'resources' | 'prompts', string[]>
}

/** `admin` is served by its own authenticated handler, not by the public `/mcp`. */
const PRIVATE_DIRS = new Set(['admin'])

/** The order the `/agents` page lists the public folders in. Unknown folders follow, alphabetically. */
const DIR_ORDER = ['docs', 'modules', 'deploy', 'changelog', 'blog', 'nuxters']

function sortDirs(dirs: string[]): string[] {
  const rank = (dir: string) => {
    const index = DIR_ORDER.indexOf(dir)
    return index === -1 ? DIR_ORDER.length : index
  }
  return [...dirs].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
}

/** Within a folder: search tools first, then lists, then single lookups. */
function verbRank(tool: string): number {
  const index = ['search', 'list', 'get'].indexOf(tool.split('-')[0]!)
  return index === -1 ? 3 : index
}

function publicDirs(dir: string): string[] {
  if (!existsSync(dir)) return []
  return sortDirs(readdirSync(dir, { withFileTypes: true })
    .filter(entry => entry.isDirectory() && !PRIVATE_DIRS.has(entry.name))
    .map(entry => entry.name))
}

/**
 * The public MCP surface of `server/mcp/`, read from the file system.
 */
export function listMcpTools(serverDir: string): McpToolsList {
  const root = join(serverDir, 'mcp')
  const toolsDir = join(root, 'tools')
  const toolDirs = publicDirs(toolsDir)

  const tools = toolDirs.flatMap(dir => readdirSync(join(toolsDir, dir))
    .filter(file => extname(file) === '.ts')
    .map(file => basename(file, '.ts'))
    .sort((a, b) => verbRank(a) - verbRank(b) || a.localeCompare(b)))

  return {
    tools,
    dirs: {
      tools: toolDirs,
      resources: publicDirs(join(root, 'resources')),
      prompts: publicDirs(join(root, 'prompts'))
    }
  }
}
