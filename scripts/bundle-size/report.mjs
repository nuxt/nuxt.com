import { constants, brotliCompressSync, gzipSync } from 'node:zlib'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { dirname, extname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const EMPTY_SIZE = Object.freeze({ raw: 0, gzip: 0, brotli: 0 })

function addSizes(target, sizes) {
  target.raw += sizes.raw
  target.gzip += sizes.gzip
  target.brotli += sizes.brotli
  return target
}

function compressedSizes(contents) {
  return {
    raw: contents.byteLength,
    gzip: gzipSync(contents, { level: 9 }).byteLength,
    brotli: brotliCompressSync(contents, {
      params: {
        [constants.BROTLI_PARAM_QUALITY]: 11
      }
    }).byteLength
  }
}

async function listFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const path = resolve(directory, entry.name)
    if (entry.isDirectory()) {
      files.push(...await listFiles(path))
    } else if (entry.isFile()) {
      files.push(path)
    }
  }

  return files
}

function assetKind(file) {
  const extension = extname(file)
  if (extension === '.js' || extension === '.mjs') {
    return 'javascript'
  }
  if (extension === '.css') {
    return 'css'
  }
  return 'other'
}

function normalizePath(path) {
  return path.replaceAll('\\', '/')
}

function normalizeModuleId(id, root) {
  let normalized = normalizePath(id).replace(/^\0/, 'virtual:')
  const normalizedRoot = `${normalizePath(resolve(root))}/`

  if (normalized.startsWith(normalizedRoot)) {
    normalized = normalized.slice(normalizedRoot.length)
  }

  const nodeModulesIndex = normalized.lastIndexOf('/node_modules/')
  if (nodeModulesIndex !== -1) {
    normalized = `node_modules/${normalized.slice(nodeModulesIndex + '/node_modules/'.length)}`
  }

  const pnpmMatch = normalized.match(/^node_modules\/\.pnpm\/[^/]+\/node_modules\/(.+)$/)
  return pnpmMatch ? `node_modules/${pnpmMatch[1]}` : normalized
}

async function readAnalyzerModules(analyzePath, root) {
  const analyzer = JSON.parse(await readFile(analyzePath, 'utf8'))
  const modules = new Map()

  for (const meta of Object.values(analyzer.nodeMetas || {})) {
    if (typeof meta.id !== 'string') {
      continue
    }

    const sizes = { ...EMPTY_SIZE }
    for (const partId of Object.values(meta.moduleParts || {})) {
      const part = analyzer.nodeParts?.[partId]
      if (part) {
        addSizes(sizes, {
          raw: part.renderedLength || 0,
          gzip: part.gzipLength || 0,
          brotli: part.brotliLength || 0
        })
      }
    }

    if (sizes.raw === 0 && sizes.gzip === 0 && sizes.brotli === 0) {
      continue
    }

    const id = normalizeModuleId(meta.id, root)
    const existing = modules.get(id) || { ...EMPTY_SIZE }
    modules.set(id, addSizes(existing, sizes))
  }

  return Object.fromEntries([...modules.entries()].sort(([a], [b]) => a.localeCompare(b)))
}

export async function buildSnapshot({ root, analyzePath, label, sha }) {
  const absoluteRoot = resolve(root)
  const publicDir = resolve(absoluteRoot, '.output/public')
  const assetDir = resolve(publicDir, '_nuxt')
  const assets = {}

  for (const path of await listFiles(assetDir)) {
    if (path.endsWith('.map') || path.endsWith('.br') || path.endsWith('.gz')) {
      continue
    }

    const file = normalizePath(relative(publicDir, path))
    assets[file] = {
      kind: assetKind(file),
      sizes: compressedSizes(await readFile(path))
    }
  }

  const totals = {
    javascript: { ...EMPTY_SIZE },
    css: { ...EMPTY_SIZE },
    other: { ...EMPTY_SIZE },
    all: { ...EMPTY_SIZE }
  }

  for (const asset of Object.values(assets)) {
    addSizes(totals[asset.kind], asset.sizes)
    addSizes(totals.all, asset.sizes)
  }

  return {
    schemaVersion: 1,
    label,
    sha,
    totals,
    assets,
    modules: await readAnalyzerModules(resolve(analyzePath), absoluteRoot)
  }
}

function formatBytes(bytes) {
  const absolute = Math.abs(bytes)
  if (absolute < 1024) {
    return `${bytes} B`
  }
  if (absolute < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KiB`
  }
  return `${(bytes / 1024 / 1024).toFixed(2)} MiB`
}

function formatDelta(base, head) {
  const delta = head - base
  if (delta === 0) {
    return '—'
  }

  const sign = delta > 0 ? '+' : ''
  const percentage = base === 0 ? '' : ` (${sign}${((delta / base) * 100).toFixed(1)}%)`
  return `${sign}${formatBytes(delta)}${percentage}`
}

function escapeMarkdown(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('@', '&#64;')
    .replaceAll('|', '\\|')
    .replaceAll('\n', ' ')
}

function metricRow(label, base, head) {
  return `| ${label} | ${formatBytes(base.brotli)} | ${formatBytes(head.brotli)} | ${formatDelta(base.brotli, head.brotli)} | ${formatDelta(base.gzip, head.gzip)} |`
}

function moduleRegressions(base, head) {
  const modules = new Set([...Object.keys(base.modules), ...Object.keys(head.modules)])
  return [...modules].map((id) => {
    const baseSize = base.modules[id] || EMPTY_SIZE
    const headSize = head.modules[id] || EMPTY_SIZE
    return {
      id,
      base: baseSize,
      head: headSize,
      delta: headSize.brotli - baseSize.brotli
    }
  }).filter(module => module.delta > 0)
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 10)
}

export function compareSnapshots(base, head) {
  const lines = [
    '## Production bundle',
    '',
    `Comparing \`${base.sha.slice(0, 8)}\` with \`${head.sha.slice(0, 8)}\`. Compressed sizes are calculated from the emitted production assets.`,
    '',
    '| Metric | Base (Brotli) | PR (Brotli) | Δ Brotli | Δ gzip |',
    '| --- | ---: | ---: | ---: | ---: |',
    metricRow('Client JavaScript', base.totals.javascript, head.totals.javascript),
    metricRow('Client CSS', base.totals.css, head.totals.css),
    metricRow('Other client assets', base.totals.other, head.totals.other),
    metricRow('Total client assets', base.totals.all, head.totals.all)
  ]

  const regressions = moduleRegressions(base, head)
  if (regressions.length > 0) {
    lines.push(
      '',
      '### Largest module increases',
      '',
      '| Module | Base (Brotli) | PR (Brotli) | Δ Brotli |',
      '| --- | ---: | ---: | ---: |',
      ...regressions.map(module => `| \`${escapeMarkdown(module.id)}\` | ${formatBytes(module.base.brotli)} | ${formatBytes(module.head.brotli)} | ${formatDelta(module.base.brotli, module.head.brotli)} |`)
    )
  }

  lines.push('', '> Module values come from Nuxt’s analyzer and are attribution estimates. This workflow is currently report-only.')

  return `${lines.join('\n')}\n`
}

function parseArguments(argv) {
  const [command, ...args] = argv
  const options = {}

  for (let index = 0; index < args.length; index++) {
    const argument = args[index]
    if (!argument.startsWith('--')) {
      throw new Error(`Unexpected argument: ${argument}`)
    }

    const key = argument.slice(2)
    const value = args[++index]
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`)
    }
    options[key] = value
  }

  return { command, options }
}

function required(options, key) {
  if (!options[key]) {
    throw new Error(`Missing required option --${key}`)
  }
  return options[key]
}

async function writeJson(path, value) {
  await mkdir(dirname(resolve(path)), { recursive: true })
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`)
}

async function main() {
  const { command, options } = parseArguments(process.argv.slice(2))

  if (command === 'snapshot') {
    const snapshot = await buildSnapshot({
      root: required(options, 'root'),
      analyzePath: required(options, 'analyze'),
      label: required(options, 'label'),
      sha: required(options, 'sha')
    })
    await writeJson(required(options, 'output'), snapshot)
    return
  }

  if (command === 'compare') {
    const base = JSON.parse(await readFile(required(options, 'base'), 'utf8'))
    const head = JSON.parse(await readFile(required(options, 'head'), 'utf8'))
    const output = required(options, 'output')
    await mkdir(dirname(resolve(output)), { recursive: true })
    await writeFile(output, compareSnapshots(base, head))
    await writeJson(required(options, 'metadata'), {
      prNumber: Number(required(options, 'pr-number')),
      headSha: head.sha
    })
    return
  }

  throw new Error('Expected the snapshot or compare command')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
