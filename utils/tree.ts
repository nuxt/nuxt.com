import type { File } from '~/types'

export function mapTree (tree, parent = null) {
  const res = []

  while (tree.length) {
    if (parent && !tree[0].path.startsWith(parent.path)) {
      break
    }

    const item: File = {
      type: tree[0].type === 'tree' ? 'directory' : 'file',
      path: tree[0].path,
      name: tree[0].path.split('/').pop(),
      status: tree[0].status
    }

    tree.shift()

    if (item.type === 'directory') {
      item.children = mapTree(tree, item)
    }

    res.push(item)
  }

  return res
}
