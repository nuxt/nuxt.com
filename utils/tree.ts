import type { File, GitHubFile, SocketUser } from '~/types'

export function mapTree (files: GitHubFile[], users: SocketUser[]) {
  const result: Array<Partial<File>> = []
  const acc: any = { result }

  files.forEach((file) => {
    const paths = file.path.split('/')

    paths.reduce((acc, name, i, arr) => {
      if (!acc[name]) {
        const isFile = i === arr.length - 1

        acc[name] = { result: [] }
        if (isFile) {
          const activeUsers = users.filter(user => user.file === file.path)
          console.log('••••••••••••••••••')
          console.log('file.path :', file.path)
          console.log('activeUsers :', activeUsers)
          acc.result.push({
            name,
            type: 'file',
            path: file.path,
            status: file.status,
            activeUsers: activeUsers.map(user => ({ alt: user.username, src: user.avatar, chip: true }))
          })
        } else {
          acc.result.push({ name, type: 'directory', path: arr.slice(0, i + 1).join('/'), children: acc[name].result })
        }
      }

      return acc[name]
    }, acc)
  })

  return result[0]?.children
}

export const findTree = function (path: string, tree: File[]): any {
  for (const file of tree) {
    if (file.path === path) {
      return tree
    }
    if (file.children) {
      const result = findTree(path, file.children)
      if (result) { return result }
    }
  }
}

export const replacePrefix = function (path: string, newPrefix: string) {
  const { name, ext } = destructurePathName(getPathName(path))
  return `${newPrefix}.${name}.${ext}`
}

export const getPathDir = function (path: string) {
  return path.replace(/\/[^/]+$/, '')
}

export const getPathName = function (path: string) {
  return path.replace(/^.*[\\/]/, '')
}

export const getPathPrefix = function (path: string) {
  const destr = destructurePathName(getPathName(path))
  return destr.prefix
}

export const isPrefix = function (prefix: string | null) {
  // allows ['0'], disallows [null, 'foo']
  return typeof prefix === 'string' && !isNaN(Number(prefix))
}

export const destructurePathName = function (path: string) {
  const split = getPathName(path).split('.')
  let prefix: string | null = null
  let name: string | null = null
  let ext: string | null = null

  if (split.length <= 1) {
    name = path
    return { prefix, name, ext }
  }

  if (split.length === 2) {
    name = split[0]
    ext = split[1]
    return { prefix, name, ext }
  }

  prefix = split.length >= 3 ? split[0] : null
  if (!isPrefix(prefix)) {
    prefix = null
  }
  ext = split[split.length - 1]
  name = split.slice(prefix ? 1 : 0, split.length - 1).join('.')
  return { prefix, name, ext }
}

export const renamePath = function (path: string, newPath: string, newPrefix: string) {
  // Get new path dir
  const newDir = getPathDir(newPath)
  // Get path name with new prefix
  const newName = replacePrefix(path, newPrefix)

  return `${newDir}/${newName}`
}

export const getAvailablePath = (path: string, files: GitHubFile[]): string => {
  // Check if path is available
  let pathAvailable = !files.find(file => file.path === path)
  if (pathAvailable) {
    return path
  }

  // try to find available path by suffixing filename
  let newPath
  let suffix = 1
  const dir = getPathDir(path)
  const file = getPathName(path)
  const [ext, ...fileParts] = file.split('.').reverse()
  const filename = fileParts.reverse().join('.')
  while (!newPath) {
    const suffixedPath = `${dir}/${filename}-${suffix}.${ext}`

    pathAvailable = !files.find(file => file.path === suffixedPath)
    if (pathAvailable) {
      newPath = suffixedPath
    }
    suffix++
  }

  return newPath
}
