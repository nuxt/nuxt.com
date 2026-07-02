import { existsSync } from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { basename, join, relative, resolve } from 'node:path'
import { parseMdc } from '../../../../helpers/mdc-parser.mjs'

interface ExampleSourceTreeItem {
  filename: string
  path: string
  children?: ExampleSourceTreeItem[]
}

interface JsDelivrFile {
  name: string
}

interface JsDelivrResponse {
  files: JsDelivrFile[]
}

const EXT_TO_LANG: Record<string, string> = {
  bash: 'bash',
  cjs: 'js',
  css: 'css',
  html: 'html',
  js: 'js',
  jsx: 'jsx',
  json: 'json',
  md: 'md',
  mjs: 'js',
  scss: 'scss',
  sh: 'bash',
  ts: 'ts',
  tsx: 'tsx',
  vue: 'vue',
  wasm: 'text',
  wat: 'text',
  yaml: 'yaml',
  yml: 'yaml',
  zsh: 'bash'
}

const EXCLUDED_EXTENSIONS = new Set([
  'avif',
  'br',
  'eot',
  'gif',
  'gz',
  'ico',
  'jpeg',
  'jpg',
  'mp3',
  'mp4',
  'ogg',
  'png',
  'svg',
  'tar',
  'ttf',
  'webm',
  'webp',
  'woff',
  'woff2',
  'zip'
])

const EXCLUDED_FILES = new Set([
  '.DS_Store',
  'Thumbs.db',
  'bun.lock',
  'bun.lockb',
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock'
])

const EXCLUDED_DIRS = new Set([
  '.git',
  '.nuxt',
  '.output',
  'dist',
  'node_modules'
])

const CONCURRENCY = 10

function normalizeRoutePath(value: string) {
  const normalized = value
    .replace(/\.json$/, '')
    .replace(/^\/+/, '')
    .replace(/\/+/g, '/')

  if (!normalized || normalized.split('/').includes('..')) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid example path' })
  }

  return normalized
}

function getExtension(filename: string) {
  return filename.split('.').pop()?.toLowerCase() || ''
}

function getLanguage(filename: string) {
  if (filename === 'Dockerfile') {
    return 'dockerfile'
  }

  return EXT_TO_LANG[getExtension(filename)] || 'text'
}

function shouldExclude(relativePath: string) {
  const parts = relativePath.split('/')
  const filename = parts.at(-1) || ''

  return parts.some(part => EXCLUDED_DIRS.has(part))
    || EXCLUDED_FILES.has(filename)
    || EXCLUDED_EXTENSIONS.has(getExtension(filename))
}

function buildTree(filePaths: string[]) {
  const root: ExampleSourceTreeItem[] = []

  for (const filePath of [...filePaths].sort()) {
    const parts = filePath.split('/')
    let current = root

    for (let index = 0; index < parts.length; index++) {
      const part = parts[index]!
      const isFile = index === parts.length - 1
      const currentPath = parts.slice(0, index + 1).join('/')

      if (isFile) {
        current.push({
          filename: part,
          path: currentPath
        })
      } else {
        let directory = current.find(item => item.children && item.path === currentPath)
        if (!directory) {
          directory = {
            filename: part,
            path: currentPath,
            children: []
          }
          current.push(directory)
        }
        current = directory.children!
      }
    }
  }

  sortTree(root)
  return root
}

function sortTree(items: ExampleSourceTreeItem[]) {
  items.sort((a, b) => {
    const aIsDirectory = Boolean(a.children)
    const bIsDirectory = Boolean(b.children)

    if (aIsDirectory !== bIsDirectory) {
      return aIsDirectory ? -1 : 1
    }

    return a.filename.localeCompare(b.filename)
  })

  for (const item of items) {
    if (item.children) {
      sortTree(item.children)
    }
  }
}

async function processInBatches<T, R>(items: T[], fn: (item: T) => Promise<R>) {
  const results: R[] = []

  for (let index = 0; index < items.length; index += CONCURRENCY) {
    const batch = items.slice(index, index + CONCURRENCY)
    results.push(...await Promise.all(batch.map(fn)))
  }

  return results
}

async function listLocalFiles(directory: string) {
  const files: string[] = []

  async function walk(currentDirectory: string) {
    const entries = await readdir(currentDirectory, { withFileTypes: true })

    for (const entry of entries) {
      const absolutePath = join(currentDirectory, entry.name)
      const relativePath = relative(directory, absolutePath).replaceAll('\\', '/')

      if (shouldExclude(relativePath)) {
        continue
      }

      if (entry.isDirectory()) {
        await walk(absolutePath)
      } else if (entry.isFile()) {
        files.push(relativePath)
      }
    }
  }

  await walk(directory)
  return files.sort()
}

function createCodeBlock(filename: string, code: string) {
  const longestFence = Math.max(2, ...Array.from(code.matchAll(/`+/g), match => match[0].length))
  const fence = '`'.repeat(longestFence + 1)
  const language = getLanguage(filename)
  const content = code.endsWith('\n') ? code : `${code}\n`

  return `${fence}${language}\n${content}${fence}`
}

async function parseFile(relativePath: string, code: string) {
  const parsed = await parseMdc(createCodeBlock(relativePath, code))

  return {
    filename: basename(relativePath),
    dir: relativePath.replace(basename(relativePath), ''),
    language: getLanguage(relativePath),
    body: parsed.body
  }
}

async function getLocalSource(localRoot: string, dirPath: string) {
  const directory = resolve(localRoot, dirPath)

  if (!directory.startsWith(localRoot) || !existsSync(directory)) {
    return
  }

  const filePaths = await listLocalFiles(directory)
  const files: Record<string, Awaited<ReturnType<typeof parseFile>>> = {}

  await processInBatches(filePaths, async (relativePath) => {
    files[relativePath] = await parseFile(relativePath, await readFile(join(directory, relativePath), 'utf8'))
  })

  return {
    tree: buildTree(filePaths),
    files
  }
}

async function getRemoteSource(org: string, repo: string, branch: string, dirPath: string) {
  const encodedBranch = branch.replaceAll('/', '%2F')
  const listing = await $fetch<JsDelivrResponse>(
    `https://data.jsdelivr.com/v1/package/gh/${org}/${repo}@${encodedBranch}/flat`
  )

  const prefix = `/${dirPath}/`.replaceAll('//', '/')
  const filePaths = listing.files
    .filter(file => file.name.startsWith(prefix))
    .map(file => file.name.slice(prefix.length))
    .filter(relativePath => relativePath && !shouldExclude(relativePath))
    .sort()

  const files: Record<string, Awaited<ReturnType<typeof parseFile>>> = {}

  await processInBatches(filePaths, async (relativePath) => {
    const rawUrl = `https://raw.githubusercontent.com/${org}/${repo}/${branch}/${dirPath}/${relativePath}`
    const code = await $fetch<string>(rawUrl, { responseType: 'text' })
    files[relativePath] = await parseFile(relativePath, code)
  })

  return {
    tree: buildTree(filePaths),
    files
  }
}

export default defineEventHandler(async (event) => {
  const dirPath = normalizeRoutePath(getRouterParam(event, 'path') || '')

  if (process.env.NUXT_EXAMPLES_PATH) {
    return await getLocalSource(process.env.NUXT_EXAMPLES_PATH, dirPath)
  }

  return await getRemoteSource('nuxt', 'examples', 'main', dirPath)
})
