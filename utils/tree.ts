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

  return result[0].children
}
