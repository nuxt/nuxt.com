import type { GitHubFile, Project, Root } from '~/types'
import { mapTree, findTree, renamePath, getPathDir, getPathPrefix } from '~/utils/tree'

const openedDirs = reactive({})

export const useProjectFilesTree = (project: Project, root: Root) => {
  const { computedFiles, bulkRename } = useProjectFiles(project, root)

  const query = useState(`project-${project.id}-tree-query`, () => '')

  // Methods

  function openDir (path: string, value?: boolean) {
    openedDirs[path] = value !== undefined ? value : !openedDirs[path]
  }

  function renameFiles (src: GitHubFile, dst: GitHubFile, position: 'above' | 'below' | 'over') {
    const filesToRename = []
    // Find files parents
    const srcDir = getPathDir(src.path)
    const dstDir = getPathDir(dst.path)
    // Find files tree
    const srcTree = findTree(src.path, tree.value)
    const dstTree = findTree(dst.path, tree.value)
    // Find files indexes in respective tree
    const srcIndex = srcTree.filter(f => f.type !== 'directory').findIndex(f => f.path === src.path)
    const dstIndex = dstTree.filter(f => f.type !== 'directory').findIndex(f => f.path === dst.path)
    // Src and dst index are the same
    const sameTree = srcDir === dstDir
    // Increment index only if src file is below / above current file or tree is different
    let index = dstIndex === -1 ? 0 : dstIndex
    if (sameTree) {
      if (position === 'below' && srcIndex > dstIndex) {
        index += 1
      } else if (position === 'above' && dstIndex > srcIndex) {
        index -= 1
      }
    } else if (position === 'below') {
      index += 1
    }

    filesToRename.push({ oldPath: src.path, newPath: renamePath(src.path, dst.path, index + 1) })

    if (sameTree) {
      if (srcIndex > dstIndex) {
        // I move a file up
        const startIndex = position === 'below' ? (dstIndex + 1) : dstIndex
        for (let i = startIndex; i < srcIndex; i++) {
          if (getPathPrefix(srcTree[i].path) !== null) {
            filesToRename.push({ oldPath: srcTree[i].path, newPath: renamePath(srcTree[i].path, srcTree[i].path, i + 2) })
          }
        }
      } else {
        // I move a file down
        const startIndex = position === 'above' ? (dstIndex - 1) : dstIndex
        for (let i = startIndex; i > srcIndex; i--) {
          if (getPathPrefix(srcTree[i].path) !== null) {
            filesToRename.push({ oldPath: srcTree[i].path, newPath: renamePath(srcTree[i].path, srcTree[i].path, i) })
          }
        }
      }
    } else {
      // Rename `srcTree` files after `srcIndex`
      let startIndex = srcIndex + 1
      for (let i = startIndex; i < srcTree.length; i++) {
        if (getPathPrefix(srcTree[i].path) !== null) {
          filesToRename.push({ oldPath: srcTree[i].path, newPath: renamePath(srcTree[i].path, srcTree[i].path, i) })
        }
      }
      // Rename `dstTree` files after `dstIndex`
      startIndex = position === 'below' ? (dstIndex + 1) : dstIndex
      for (let i = startIndex; i < dstTree.length; i++) {
        if (getPathPrefix(dstTree[i].path) !== null) {
          filesToRename.push({ oldPath: dstTree[i].path, newPath: renamePath(dstTree[i].path, dstTree[i].path, i + 2) })
        }
      }
    }

    bulkRename(filesToRename.filter(f => f.oldPath !== f.newPath))
  }

  // Computed

  const filteredComputedFiles = computed(() => {
    return query.value ? computedFiles.value.filter(f => f.path.search(new RegExp(query.value, 'i')) !== -1) : computedFiles.value
  })

  const tree = computed(() => {
    const files = [...filteredComputedFiles.value]
    files.sort((a, b) => a.path.localeCompare(b.path, undefined, {
      numeric: true,
      sensitivity: 'base'
    }))

    return mapTree(files)
  })

  return {
    query,
    // Methods
    openDir,
    renameFiles,
    // Computed
    tree,
    // Data
    openedDirs: readonly(openedDirs)
  }
}
