export function mapTree (tree) {
  const result = []
  const acc = { result }

  tree.forEach((file) => {
    const paths = file.path.split('/')

    paths.reduce((acc, name, i, arr) => {
      if (!acc[name]) {
        const isFile = i === arr.length - 1

        acc[name] = { result: [] }
        if (isFile) {
          acc.result.push({ name, type: 'file', path: file.path, status: file.status })
        } else {
          acc.result.push({ name, type: 'directory', path: arr.slice(0, i + 1).join('/'), children: acc[name].result })
        }
      }

      return acc[name]
    }, acc)
  })

  return result[0]?.children
}

export const findTree = function (path, tree) {
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

export const replacePrefix = function (path, newPrefix) {
  const split = path.split('/')
  let [prefix, name, ext] = split.pop().split('.')
  // Case when file has no prefix
  if (!Number(prefix)) {
    ext = name
    name = prefix
    prefix = null
  }

  return `${newPrefix}.${name}.${ext}`
}

export const getPathDir = function (path) {
  return path.replace(/\/[^/]+$/, '')
}

export const getPathName = function (path) {
  return path.replace(/^.*[\\/]/, '')
}

export const renamePath = function (path, newPath, newPrefix) {
  // Get new path dir
  const newDir = getPathDir(newPath)
  // Get path name with new prefix
  const newName = replacePrefix(path, newPrefix)

  return `${newDir}/${newName}`
}
