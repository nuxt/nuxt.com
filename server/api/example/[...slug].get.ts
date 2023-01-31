import { useShikiHighlighter } from '@nuxt/content/transformers/shiki/index'

export interface File {
  'type': 'file' | 'dir'
  name: string
  path: string
  code?: string
  styles?: string
  image?: string
}

const config = useRuntimeConfig()

export default defineCachedEventHandler(async (event) => {
  const { slug } = getRouterParams(event)
  const { repo, branch, dir } = slug.match(/^(?<repo>[^/]+\/[^/]+)\/branch\/(?<branch>[^/]+)\/dir\/(?<dir>.*)$/)?.groups ?? {}
  if (!dir) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Example directory must be provided.'
    })
  }
  if (!config.sandbox?.allowedRepos?.includes(repo) || !config.sandbox.allowedBranches?.includes(branch)) {
    throw createError({
      statusCode: 403,
      statusMessage: 'Access to this repository is not allowed.'
    })
  }
  const _files = await fetchFiles(repo, dir, dir)
  const files = await Promise.all(_files.map(async (file) => {
    const { content } = await fetchFile(repo, file.path, dir)
    const newFile: File = {
      type: file.type,
      path: file.path,
      name: file.name,
      ...await highlightContents(file.name, content)
    }
    return [file.path, newFile]
  }))
  return Object.fromEntries(files) as Record<string, File>
}, {
  // 1 hour
  maxAge: 60 * 60
})

const { getHighlightedCode } = useShikiHighlighter()

const github = $fetch.create({
  baseURL: 'https://api.github.com/repos',
  headers: {
    Authorization: config.githubAPI?.token ? `Bearer ${config.githubAPI.token}` : ''
  }
})

const LOCK_FILES = ['yarn.lock', 'package-lock.json', 'pnpm-lock.yaml']
function isLockFile (path: string) {
  return LOCK_FILES.some(filename => path.endsWith(filename))
}

async function fetchFiles (repo: string, path: string, dir: string): Promise<File[]> {
  const promises = []
  let files = await github<File[]>(`${repo}/contents/${path}`)

  // Remove lock files
  files = files.filter(file => !isLockFile(file.path))
  files.sort((a, b) => {
    if (a.type === 'dir' && b.type === 'file') { return -1 }
    if (a.type === 'file' && b.type === 'dir') { return 1 }
    return a.name.localeCompare(b.name)
  })

  for (const file of files) {
    if (file.type === 'dir') {
      promises.push(fetchFiles(repo, file.path, dir).then((newFiles) => {
        const currentIndex = files.indexOf(file)
        files.splice(currentIndex, files.length, file, ...newFiles, ...files.slice(currentIndex + 1))
      }))
    }
    file.path = file.path.replace(`${dir}/`, '')
  }

  await Promise.all(promises)
  return files
}

function fetchFile (repo: string, path: string, dir: string) {
  return github<File & { content: string }>(`${repo}/contents/${dir}/${path}`)
}

const images = ['.ico', '.png', '.jpg']
function highlightContents (name: string, content: string) {
  if (!content || !name) { return {} }

  if (images.some(ext => name.endsWith(ext))) {
    return { image: `data:image/png;base64,${content}` }
  }

  const ext = name.split('.').pop()
  const code = Buffer.from(content, 'base64').toString()

  return getHighlightedCode(code, ext, 'github-dark') as Promise<{ code: string, styles: string }>
}
